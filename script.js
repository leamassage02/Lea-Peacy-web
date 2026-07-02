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
  const openModalBtns = document.querySelectorAll(".open-booking-modal");
  const closeModalBtn = document.querySelector(".modal-close-btn");

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
  openModalBtns.forEach(btn => btn.addEventListener("click", openModal));
  closeModalBtn?.addEventListener("click", closeModal);

  // Close modal when clicking on overlay background
  bookingModal?.addEventListener("click", (e) => {
    if (e.target === bookingModal) {
      closeModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
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
        // Dynamically resolve contact.php path based on script.js tag source
        const scriptTag = document.querySelector('script[src*="script.js"]');
        const scriptSrc = scriptTag ? scriptTag.getAttribute('src') : 'script.js';
        const projectRoot = scriptSrc.replace('script.js', '');
        const response = await fetch(projectRoot + "contact.php", {
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

  // ==========================================================================
  // 6. Scroll-Triggered Entrance Animations (IntersectionObserver)
  // ==========================================================================
  const animatedElements = document.querySelectorAll(".animate-on-scroll");

  if (animatedElements.length > 0 && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // Only animate once
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback: make everything visible immediately
    animatedElements.forEach((el) => el.classList.add("is-visible"));
  }

  // ==========================================================================
  // 7. Gallery Lightbox
  // ==========================================================================
  const lightbox = document.querySelector(".lightbox-overlay");
  const lightboxImg = document.querySelector(".lightbox-img");
  const lightboxClose = document.querySelector(".lightbox-close");
  const galleryItems = document.querySelectorAll(".gallery-item-frame");

  if (lightbox && lightboxImg && galleryItems.length > 0) {
    galleryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector(".gallery-image");
        if (img) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          lightbox.classList.add("open");
          document.body.style.overflow = "hidden";
        }
      });
    });

    // Close lightbox
    const closeLightbox = () => {
      lightbox.classList.remove("open");
      document.body.style.overflow = "auto";
    };

    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox();
      }
    });
  }

  // ==========================================================================
  // 8. Back to Top Button
  // ==========================================================================
  const backToTopBtn = document.querySelector(".back-to-top");

  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 600) {
        backToTopBtn.classList.add("visible");
      } else {
        backToTopBtn.classList.remove("visible");
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
