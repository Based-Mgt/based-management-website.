/* --------------------------------------------------------------------------
   BASED MANAGEMENT SITE INTERACTIONS
   This file uses plain browser JavaScript. There is no framework or build step,
   which means you can edit it directly and upload the folder to any static host.
   -------------------------------------------------------------------------- */

// Header shadow: adds a small amount of depth once the visitor scrolls away from the top.
// Find the header using the HTML hook [data-header].
const header = document.querySelector('[data-header]');

// Header shadow update: keeps the class logic in one function so it is easy to change later.
// Update the header styling to match the scroll position.
function updateHeaderState() {
  // Skip the update when the page has no site header.
  if (!header) return;
  // Add the header shadow after the visitor scrolls down a little.
  header.classList.toggle('is-scrolled', window.scrollY > 12);
// Close the current block or expression.
}

// Header listeners: update once on load and again whenever the page is scrolled.
// Set the right header style as soon as the script loads.
updateHeaderState();
// Refresh the header as the visitor scrolls.
window.addEventListener('scroll', updateHeaderState, { passive: true });

// Mobile menu elements: these references power the open/close behavior on smaller screens.
// Find the menu button using the HTML hook [data-menu-button].
const menuButton = document.querySelector('[data-menu-button]');
// Find the mobile menu using the HTML hook [data-mobile-menu].
const mobileMenu = document.querySelector('[data-mobile-menu]');

// Mobile menu toggle: synchronizes the visible panel with the button's accessibility state.
// Set the mobile menu visibility and screen reader state together.
function setMobileMenu(open) {
  // Skip the menu update if its button or panel is missing.
  if (!menuButton || !mobileMenu) return;
  // Tell assistive technology whether the panel is open.
  menuButton.setAttribute('aria-expanded', String(open));
  // Describe what the menu button will do on its next press.
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  // Hide the menu panel when its open flag is false.
  mobileMenu.hidden = !open;
// Close the current block or expression.
}

// Mobile menu button click: flips between the current open and closed states.
// Respond to a tap or keyboard activation of the menu button.
menuButton?.addEventListener('click', () => {
  // Read the current expanded state from the button.
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  // Switch the menu to the opposite of its current state.
  setMobileMenu(!isOpen);
// Close the current block or expression.
});

// Mobile navigation links: closing the panel after a selection keeps the phone experience tidy.
// Visit each link inside the mobile menu.
mobileMenu?.querySelectorAll('a').forEach((link) => {
  // Close the menu after the visitor follows a link.
  link.addEventListener('click', () => setMobileMenu(false));
// Close the current block or expression.
});

// Responsive cleanup: if the browser grows back to desktop width, any open mobile menu is reset.
// Watch for changes to the browser width.
window.addEventListener('resize', () => {
  // Close the mobile menu when the desktop layout takes over.
  if (window.innerWidth > 860) setMobileMenu(false);
// Close the current block or expression.
});

// Scroll reveal elements: content fades in only when it is close enough to be seen.
// Collect the elements that animate into view while scrolling.
const revealItems = document.querySelectorAll('.reveal');

// Scroll reveal observer: IntersectionObserver is lightweight and avoids continuous scroll calculations.
// Check whether the browser can detect elements entering the viewport.
const revealObserver = 'IntersectionObserver' in window
  // Create one shared observer for scroll animations.
  ? new IntersectionObserver((entries, observer) => {
      // Process each element reported by the observer.
      entries.forEach((entry) => {
        // Wait until the element actually enters the visible area.
        if (!entry.isIntersecting) return;
        // Show the element by applying its visible style.
        entry.target.classList.add('is-visible');
        // Stop watching this element after it has appeared once.
        observer.unobserve(entry.target);
      // Close the current block or expression.
      });
    // Trigger the reveal when roughly 12 percent of the element enters the viewing area.
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  // Leave the observer empty on browsers that lack this feature.
  : null;

// Scroll reveal activation: browsers without IntersectionObserver simply show everything immediately.
// Set up reveal behavior for each matching element.
revealItems.forEach((item) => {
  // Ask the observer to watch this element.
  if (revealObserver) revealObserver.observe(item);
  // Show the element by applying its visible style.
  else item.classList.add('is-visible');
// Close the current block or expression.
});

// Find the horizontal photo track and its arrow controls.
const galleryTrack = document.querySelector('[data-gallery]');
const galleryControls = document.querySelector('[data-gallery-controls]');

// Reveal the controls only when there are photos to browse.
if (galleryTrack?.firstElementChild && galleryControls) {
  // Wire each arrow to move by one photo and the gap beside it.
  galleryControls.querySelectorAll('[data-gallery-step]').forEach((arrow) => {
    // Wait for the visitor to press this arrow.
    arrow.addEventListener('click', () => {
      // Use the current photo width so the arrows work at every screen size.
      const photoWidth = galleryTrack.firstElementChild.getBoundingClientRect().width;
      // Read the same gap that CSS uses between photos.
      const gap = Number.parseFloat(getComputedStyle(galleryTrack).columnGap);
      // A negative direction goes to the previous photo and a positive direction goes to the next.
      const direction = Number(arrow.dataset.galleryStep);
      // Respect the visitor's reduced-motion preference when scrolling.
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
      // Let scroll snapping align the nearest photo after the move.
      galleryTrack.scrollBy({ left: direction * (photoWidth + gap), behavior });
    });
  });
  // Show the arrows once their click handlers are ready.
  galleryControls.hidden = false;
}

// Lightbox elements: the native dialog lets visitors inspect a gallery photo at a larger size.
// Find the lightbox using the HTML hook [data-lightbox].
const lightbox = document.querySelector('[data-lightbox]');
// Find the lightbox image using the HTML hook [data-lightbox-image].
const lightboxImage = document.querySelector('[data-lightbox-image]');
// Find the lightbox close using the HTML hook [data-lightbox-close].
const lightboxClose = document.querySelector('[data-lightbox-close]');

// Gallery tiles and the viewer share the same image, including its path in production builds.
// Give every gallery tile its own photo viewer action.
document.querySelectorAll('[data-gallery-item]').forEach((item) => {
  // Open the chosen tile when the visitor activates it.
  item.addEventListener('click', () => {
    // Find the image inside the selected gallery tile.
    const photo = item.querySelector('img');
    // Skip opening the viewer if the dialog or image is missing.
    if (!lightbox || !lightboxImage || !photo) return;
    // Load the same image file in the enlarged viewer.
    lightboxImage.src = photo.currentSrc || photo.src;
    // Carry the photo description into the enlarged view.
    lightboxImage.alt = photo.alt;
    // Open the photo viewer as a modal dialog.
    lightbox.showModal();
  // Close the current block or expression.
  });
// Close the current block or expression.
});

// Lightbox close button: explicit close control is available for mouse, touch, and keyboard users.
// Close the photo viewer when its close button is pressed.
lightboxClose?.addEventListener('click', () => lightbox?.close());

// Lightbox backdrop click: clicking outside the photo closes the viewer in the expected gallery pattern.
// Listen for clicks inside the photo viewer and on its backdrop.
lightbox?.addEventListener('click', (event) => {
  // Dismiss the viewer when the visitor clicks outside the photo.
  if (event.target === lightbox) lightbox.close();
// Close the current block or expression.
});

// Copyright year: keeps the footer current without requiring a code edit every January.
// Find the year target using the HTML hook [data-year].
const yearTarget = document.querySelector('[data-year]');
// Display the current year in the footer.
if (yearTarget) yearTarget.textContent = String(new Date().getFullYear());

// Find the question form using the HTML hook [data-question-form].
const questionForm = document.querySelector('[data-question-form]');
// Remember the latest attempt so an unchanged retry can reuse its identifier.
let lastQuestionAttempt;

// Send the form through JavaScript when the visitor submits it.
questionForm?.addEventListener('submit', async (event) => {
  // Keep the visitor on the page while the submission runs.
  event.preventDefault();
  // Find the Send Question button so it can be disabled during sending.
  const button = questionForm.querySelector('button[type="submit"]');
  // Find the status area that announces progress or errors.
  const status = questionForm.querySelector('[data-question-status]');
  // Ignore another submit while the button is disabled.
  if (button.disabled) return;

  // Collect the form fields and format the submission as JSON.
  const body = JSON.stringify(Object.fromEntries(new FormData(questionForm)));
  // Create a new attempt only when the form contents have changed.
  if (lastQuestionAttempt?.body !== body) {
    // Assign an identifier that can be reused on a retry.
    lastQuestionAttempt = { body, id: crypto.randomUUID() };
  // Close the current block or expression.
  }

  // Prevent double-clicks while the request is in progress.
  button.disabled = true;
  // Mark the button as busy until the request finishes.
  button.setAttribute('aria-busy', 'true');
  // Show that the form is waiting for a response.
  status.textContent = 'Sending your question…';
  // Start the operation that can fail and needs an error response.
  try {
    // Send the form to the endpoint configured in its action attribute.
    const response = await fetch(questionForm.action, {
      // Use POST because this request submits a new question.
      method: 'POST',
      // Set the headers needed for JSON or email delivery.
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': lastQuestionAttempt.id },
      // Include the JSON payload in the outgoing request or response.
      body,
    // Close the current block or expression.
    });
    // Read the server response before showing a success message.
    const result = await response.json();
    // Treat HTTP errors and rejected sends as unsuccessful submissions.
    if (!response.ok || !result.ok) throw new Error(result.error);

    // Clear the form after a successful send.
    questionForm.reset();
    // Discard the completed request identifier.
    lastQuestionAttempt = undefined;
    // Confirm that the server accepted the question.
    status.textContent = 'Your question was sent. We’ll reply by email.';
  // Handle an error from the operation above.
  } catch {
    // Show the fallback email address if the send fails.
    status.textContent = 'Your question couldn’t be sent. Try again or email office@basedmgt.com.';
  // Run this cleanup after either success or failure.
  } finally {
    // Clear the busy state even if the request failed.
    button.removeAttribute('aria-busy');
    // Make the button available for another question or a retry.
    button.disabled = false;
  // Close the current block or expression.
  }
// Close the current block or expression.
});
