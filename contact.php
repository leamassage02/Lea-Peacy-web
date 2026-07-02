<?php
/**
 * Lea Peachy Massage & Spa - PHP Mail Handler (Static Version)
 * Natively compatible with Hostinger shared hosting environments.
 */

// Set JSON response header
header("Content-Type: application/json; charset=UTF-8");

// Prevent direct GET access
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Form submissions must use POST."
    ]);
    exit;
}

// Retrieve and sanitize form parameters
$name = isset($_POST["name"]) ? trim($_POST["name"]) : "";
$email = isset($_POST["email"]) ? trim($_POST["email"]) : "";
$subject_raw = isset($_POST["subject"]) ? trim($_POST["subject"]) : "";
$message = isset($_POST["message"]) ? trim($_POST["message"]) : "";

// Validate required fields
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please complete all required fields (Name, Email, Message)."
    ]);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);
    exit;
}

// Target destination
$to = "leamassage02@gmail.com";

// Formatted subject
$subject = "Lea Peachy Contact: " . (empty($subject_raw) ? "New Inquiry from " . $name : $subject_raw);

// HTML Email Layout (matches original styling)
$email_content = '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Inquiry - Lea Peachy Spa</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F8F3EA; font-family: sans-serif;">
  <div style="background-color: #ffffff; border: 1px solid #1F3A2E; max-width: 600px; margin: 0 auto; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <h2 style="color: #1F3A2E; border-bottom: 2px solid #C9A24B; padding-bottom: 15px; margin-top: 0; font-family: serif; font-size: 24px;">
      New Inquiry - Lea Peachy Spa
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 100px; color: #1F3A2E;">Name:</td>
        <td style="padding: 8px 0; color: #2B2B2B;">' . htmlspecialchars($name) . '</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #1F3A2E;">Email:</td>
        <td style="padding: 8px 0; color: #2B2B2B;">' . htmlspecialchars($email) . '</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #1F3A2E;">Subject:</td>
        <td style="padding: 8px 0; color: #2B2B2B;">' . (empty($subject_raw) ? "N/A" : htmlspecialchars($subject_raw)) . '</td>
      </tr>
    </table>
    <hr style="border: 0; border-top: 1px solid rgba(31,58,46,0.1); margin: 20px 0;">
    <h3 style="color: #1F3A2E; font-size: 16px; margin-bottom: 10px;">Message Content:</h3>
    <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #C9A24B; color: #2B2B2B; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' . nl2br(htmlspecialchars($message)) . '</div>
  </div>
</body>
</html>';

$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'leapeachyspa.com';
// Stripping www. prefix and any port numbers from host
$host_clean = preg_replace('/^www\./', '', $host);
$host_clean = explode(':', $host_clean)[0];

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8" . "\r\n";
$headers .= "From: Lea Peachy Spa <noreply@" . $host_clean . ">" . "\r\n";
$headers .= "Reply-To: " . $name . " <" . $email . ">" . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send email using PHP's native mail system
$success = mail($to, $subject, $email_content, $headers);

if ($success) {
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Thank you! Your message has been sent successfully. We will respond shortly."
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to deliver email. Server mail routing issue. Please try again later."
    ]);
}
?>
