<?php
/**
 * Lea Peachy Massage & Spa - SMTP Contact Form Handler
 * Sends email via authenticated SMTP (Hostinger) instead of PHP mail().
 */

// JSON response header
header("Content-Type: application/json; charset=UTF-8");

// Only allow POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit;
}

// ── SMTP Configuration ──────────────────────────────────────────────────────
$smtpHost     = "ssl://smtp.hostinger.com";
$smtpPort     = 465;
$smtpUser     = "contact@leapeachyspa.com";
$smtpPass     = "2#kUk-xQ29Gi-3:";
$fromName     = "Lea Peachy Spa";
$toEmail      = "leamassage02@gmail.com";
// ─────────────────────────────────────────────────────────────────────────────

// Retrieve and sanitize form fields
$name        = isset($_POST["name"])    ? trim($_POST["name"])    : "";
$email       = isset($_POST["email"])   ? trim($_POST["email"])   : "";
$subject_raw = isset($_POST["subject"]) ? trim($_POST["subject"]) : "";
$message     = isset($_POST["message"]) ? trim($_POST["message"]) : "";

// Validate required fields
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please complete all required fields (Name, Email, Message)."]);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please enter a valid email address."]);
    exit;
}

// Build subject line
$subject = "Lea Peachy Contact: " . (empty($subject_raw) ? "New Inquiry from " . $name : $subject_raw);

// Build HTML email body
$body = '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New Inquiry</title></head>
<body style="margin:0;padding:20px;background-color:#F8F3EA;font-family:sans-serif;">
  <div style="background-color:#ffffff;border:1px solid #1F3A2E;max-width:600px;margin:0 auto;padding:30px;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
    <h2 style="color:#1F3A2E;border-bottom:2px solid #C9A24B;padding-bottom:15px;margin-top:0;font-family:serif;font-size:24px;">
      New Inquiry - Lea Peachy Spa
    </h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:8px 0;font-weight:bold;width:100px;color:#1F3A2E;">Name:</td>
        <td style="padding:8px 0;color:#2B2B2B;">' . htmlspecialchars($name) . '</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:bold;color:#1F3A2E;">Email:</td>
        <td style="padding:8px 0;color:#2B2B2B;">' . htmlspecialchars($email) . '</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:bold;color:#1F3A2E;">Subject:</td>
        <td style="padding:8px 0;color:#2B2B2B;">' . (empty($subject_raw) ? "N/A" : htmlspecialchars($subject_raw)) . '</td>
      </tr>
    </table>
    <hr style="border:0;border-top:1px solid rgba(31,58,46,0.1);margin:20px 0;">
    <h3 style="color:#1F3A2E;font-size:16px;margin-bottom:10px;">Message Content:</h3>
    <div style="background-color:#f9f9f9;padding:20px;border-left:4px solid #C9A24B;color:#2B2B2B;font-size:14px;line-height:1.6;white-space:pre-wrap;">' . nl2br(htmlspecialchars($message)) . '</div>
  </div>
</body>
</html>';

// ── Minimal SMTP Sender ─────────────────────────────────────────────────────

/**
 * Send an email using raw SMTP socket connection.
 * No external libraries required.
 */
function sendSmtpEmail($host, $port, $user, $pass, $fromEmail, $fromName, $toEmail, $replyToEmail, $replyToName, $subject, $htmlBody) {
    $errors = [];

    // Open SSL socket to SMTP server
    $socket = @stream_socket_client(
        "$host:$port",
        $errno,
        $errstr,
        30, // timeout in seconds
        STREAM_CLIENT_CONNECT,
        stream_context_create(["ssl" => ["verify_peer" => false, "verify_peer_name" => false]])
    );

    if (!$socket) {
        return ["success" => false, "error" => "Could not connect to mail server: $errstr ($errno)"];
    }

    // Helper: read server response
    $readResponse = function() use ($socket) {
        $response = "";
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            // If the 4th character is a space, this is the last line
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $response;
    };

    // Helper: send command and get response
    $sendCommand = function($command) use ($socket, $readResponse) {
        fwrite($socket, $command . "\r\n");
        return $readResponse();
    };

    // Helper: check response code
    $expectCode = function($response, $expectedCode) {
        return strpos($response, (string)$expectedCode) === 0;
    };

    // Read server greeting
    $greeting = $readResponse();
    if (!$expectCode($greeting, 220)) {
        fclose($socket);
        return ["success" => false, "error" => "Unexpected greeting: $greeting"];
    }

    // EHLO
    $ehloResp = $sendCommand("EHLO leapeachyspa.com");
    if (!$expectCode($ehloResp, 250)) {
        fclose($socket);
        return ["success" => false, "error" => "EHLO failed: $ehloResp"];
    }

    // AUTH LOGIN
    $authResp = $sendCommand("AUTH LOGIN");
    if (!$expectCode($authResp, 334)) {
        fclose($socket);
        return ["success" => false, "error" => "AUTH LOGIN failed: $authResp"];
    }

    // Send username (base64)
    $userResp = $sendCommand(base64_encode($user));
    if (!$expectCode($userResp, 334)) {
        fclose($socket);
        return ["success" => false, "error" => "Username rejected: $userResp"];
    }

    // Send password (base64)
    $passResp = $sendCommand(base64_encode($pass));
    if (!$expectCode($passResp, 235)) {
        fclose($socket);
        return ["success" => false, "error" => "Authentication failed: $passResp"];
    }

    // MAIL FROM
    $fromResp = $sendCommand("MAIL FROM:<$fromEmail>");
    if (!$expectCode($fromResp, 250)) {
        fclose($socket);
        return ["success" => false, "error" => "MAIL FROM rejected: $fromResp"];
    }

    // RCPT TO
    $rcptResp = $sendCommand("RCPT TO:<$toEmail>");
    if (!$expectCode($rcptResp, 250)) {
        fclose($socket);
        return ["success" => false, "error" => "RCPT TO rejected: $rcptResp"];
    }

    // DATA
    $dataResp = $sendCommand("DATA");
    if (!$expectCode($dataResp, 354)) {
        fclose($socket);
        return ["success" => false, "error" => "DATA command rejected: $dataResp"];
    }

    // Build RFC-compliant email message with headers
    $boundary = md5(uniqid(time()));
    $headers  = "Date: " . date("r") . "\r\n";
    $headers .= "From: $fromName <$fromEmail>\r\n";
    $headers .= "Reply-To: $replyToName <$replyToEmail>\r\n";
    $headers .= "To: <$toEmail>\r\n";
    $headers .= "Subject: $subject\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: LeaPeachySpa/1.0\r\n";
    $headers .= "\r\n";

    // Ensure lines don't start with a dot (SMTP transparency)
    $safeBody = str_replace("\r\n.", "\r\n..", $htmlBody);

    // Send headers + body + terminator
    fwrite($socket, $headers . $safeBody . "\r\n.\r\n");

    $sendResp = $readResponse();
    if (!$expectCode($sendResp, 250)) {
        fclose($socket);
        return ["success" => false, "error" => "Message delivery failed: $sendResp"];
    }

    // QUIT
    $sendCommand("QUIT");
    fclose($socket);

    return ["success" => true];
}

// ── Execute ──────────────────────────────────────────────────────────────────

$result = sendSmtpEmail(
    $smtpHost,
    $smtpPort,
    $smtpUser,
    $smtpPass,
    $smtpUser,         // from email
    $fromName,         // from name
    $toEmail,          // to email
    $email,            // reply-to email (visitor's email)
    $name,             // reply-to name (visitor's name)
    $subject,
    $body
);

if ($result["success"]) {
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Thank you! Your message has been sent successfully. We will respond shortly."
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to send your message. Please try again later or contact us directly."
    ]);
    // Log error for debugging (visible in Hostinger error logs)
    error_log("LeaPeachy SMTP Error: " . ($result["error"] ?? "Unknown error"));
}
?>
