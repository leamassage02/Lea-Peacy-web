/**
 * Lea Peachy Massage & Spa - Interactive Scripts (Static Version)
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. Sticky Header scroll behavior & Mobile Overlay Menu
  // ==========================================================================
  const header = document.querySelector(".site-header");
  const mobileToggle = document.querySelector(".mobile-toggle");
  const mobileMenu = document.querySelector(".mobile-menu-overlay");
  const mobileMenuLinks = document.querySelectorAll(".mobile-nav-links a");

  // Scroll effect
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  });

  // Mobile menu toggle
  if (mobileToggle && mobileMenu && header) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      header.classList.toggle("menu-open", isOpen);
      
      // Prevent body scrolling when menu is open
      document.body.style.overflow = isOpen ? "hidden" : "auto";
    });
  }

  // Close mobile menu when links are clicked
  mobileMenuLinks.forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu?.classList.remove("open");
      header?.classList.remove("menu-open");
      document.body.style.overflow = "auto";
    });
  });

  // ==========================================================================
  // 2. Booking Modal Handler
  // ==========================================================================
  const bookingModal = document.querySelector(".booking-modal-overlay");
  const openModalBtns = document.querySelectorAll(".open-booking-modal, .btn-primary, .btn-secondary, .btn-outline-forest");
  const closeModalBtn = document.querySelector(".modal-close-btn");

  // Filter open buttons to make sure we don't grab form submits or normal page links
  const validOpenBtns = Array.from(openModalBtns).filter(btn => {
    // Skip if it's a link to another page (like "Philosophy" or "View Services")
    if (btn.tagName === "A" && btn.getAttribute("href") !== "#" && btn.getAttribute("href")) {
      // Except if it explicitly has the open-booking-modal class
      return btn.classList.contains("open-booking-modal");
    }
    // Skip if it's a form submit button in contact page
    if (btn.getAttribute("type") === "submit") {
      return false;
    }
    return true;
  });

  // Function to open modal
  const openModal = (e) => {
    if (e) e.preventDefault();
    if (bookingModal) {
      bookingModal.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  };

  // Function to close modal
  const closeModal = () => {
    if (bookingModal) {
      bookingModal.classList.remove("open");
      // Only restore scroll if mobile menu overlay is not open
      const isMobileMenuOpen = mobileMenu?.classList.contains("open");
      document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
    }
  };

  // Attach event listeners
  validOpenBtns.forEach(btn => btn.addEventListener("click", openModal));
  closeModalBtn?.addEventListener("click", closeModal);

  // Close modal when clicking on overlay background
  bookingModal?.addEventListener("click", (e) => {
    if (e.target === bookingModal) {
      closeModal();
    }
  });

  // ==========================================================================
  // 3. Testimonials Carousel Auto-Slide
  // ==========================================================================
  const slides = document.querySelectorAll(".testimonial-slide");
  const dots = document.querySelectorAll(".slider-dot");
  let activeSlideIdx = 0;
  let carouselInterval = null;

  const showSlide = (index) => {
    if (slides.length === 0) return;
    
    // Deactivate current
    slides[activeSlideIdx]?.classList.remove("active");
    dots[activeSlideIdx]?.classList.remove("active");

    // Update index safely
    activeSlideIdx = (index + slides.length) % slides.length;

    // Activate new
    slides[activeSlideIdx]?.classList.add("active");
    dots[activeSlideIdx]?.classList.add("active");
  };

  const startCarousel = () => {
    if (slides.length === 0) return;
    carouselInterval = setInterval(() => {
      showSlide(activeSlideIdx + 1);
    }, 5000);
  };

  const resetCarouselTimer = () => {
    if (carouselInterval) {
      clearInterval(carouselInterval);
      startCarousel();
    }
  };

  // Initialize slides
  if (slides.length > 0) {
    showSlide(0);
    startCarousel();

    // Attach dot click events
    dots.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        showSlide(idx);
        resetCarouselTimer();
      });
    });
  }

  // ==========================================================================
  // 4. Seamless Hero Video Cross-Fade
  // ==========================================================================
  const vid0 = document.getElementById("hero-vid-0");
  const vid1 = document.getElementById("hero-vid-1");
  let activeVidIdx = 0;

  if (vid0 && vid1) {
    // Make sure player 0 starts playing
    vid0.play().catch(() => {});

    // Player 0 ended handler
    vid0.addEventListener("ended", () => {
      activeVidIdx = 1;
      vid1.classList.add("active");
      vid0.classList.remove("active");
      
      // Start second player immediately
      vid1.currentTime = 0;
      vid1.play().catch(() => {});
      
      // Delay pause on hidden player to let cross-fade transition complete
      setTimeout(() => {
        if (activeVidIdx === 1) vid0.pause();
      }, 1200);
    });

    // Player 1 ended handler
    vid1.addEventListener("ended", () => {
      activeVidIdx = 0;
      vid0.classList.add("active");
      vid1.classList.remove("active");
      
      // Restart first player
      vid0.currentTime = 0;
      vid0.play().catch(() => {});
      
      // Delay pause
      setTimeout(() => {
        if (activeVidIdx === 0) vid1.pause();
      }, 1200);
    });
  }

  // ==========================================================================
  // 5. Contact Form Handler (AJAX submission to PHP)
  // ==========================================================================
  const contactForm = document.getElementById("contact-form");
  const alertSuccess = document.getElementById("alert-success");
  const alertError = document.getElementById("alert-error");
  const submitBtn = contactForm?.querySelector("button[type='submit']");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Clear alerts
      if (alertSuccess) alertSuccess.style.display = "none";
      if (alertError) alertError.style.display = "none";

      // Set submit loading state
      const originalBtnText = submitBtn ? submitBtn.innerHTML : "Send Message";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Sending...";
      }

      try {
        const formData = new FormData(contactForm);
        const response = await fetch("contact.php", {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Success alert
          if (alertSuccess) {
            alertSuccess.style.display = "block";
            alertSuccess.innerHTML = result.message || "Thank you! Your message has been sent successfully.";
          }
          contactForm.reset();
        } else {
          // Server error
          throw new Error(result.message || "Failed to submit message. Please try again.");
        }
      } catch (error) {
        // Network/client error
        if (alertError) {
          alertError.style.display = "block";
          alertError.innerHTML = error.message || "Failed to submit message. Please check your connection and try again.";
        }
      } finally {
        // Reset submit button state
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }
});
