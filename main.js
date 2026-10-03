// Dynamic copyright year
const yearSpan = document.getElementById('current-year');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Mobile Navigation Drawer Toggle
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

if (mobileToggle && navMenu) {
  mobileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active', isActive);
  });

  // Close menu when clicking navigation links
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      mobileToggle.classList.remove('active');
    });
  });

  // Close menu when clicking outside of navbar
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
      navMenu.classList.remove('active');
      mobileToggle.classList.remove('active');
    }
  });
}

// Google Maps Authentication Failure Handler & Fallback
window.gm_authFailure = function () {
  console.warn('Google Maps API: Authentication failed or placeholder API key in use (YOUR_GOOGLE_MAPS_API_KEY). Standard text input fallback is active.');

  const hint = document.getElementById('location-hint');
  if (hint) {
    hint.textContent = 'Enter venue name and city/state manually.';
  }

  // Remove any breaking error dialog or modal overlay injected by Google Maps
  const removeGoogleModals = () => {
    const errorContainers = document.querySelectorAll('.gm-err-container, .gm-err-message, div[style*="z-index: 1000000"], div[style*="z-index: 1000001"]');
    errorContainers.forEach(el => el.remove());
  };

  removeGoogleModals();
  setTimeout(removeGoogleModals, 100);
  setTimeout(removeGoogleModals, 500);
  setTimeout(removeGoogleModals, 1500);
};

// Google Places Autocomplete API Integration
window.initGooglePlaces = function () {
  const input = document.getElementById('venueLocation');
  if (!input) return;

  try {
    if (window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'name', 'geometry']
      });

      autocomplete.addListener('place_changed', function () {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          input.value = place.name ? `${place.name}, ${place.formatted_address}` : place.formatted_address;
        }
      });
    }
  } catch (err) {
    console.warn('Google Places initialization fallback active:', err);
  }
};

// URL Query Params Package Pre-selection
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const packageParam = params.get('package');
  const detailsField = document.getElementById('details');
  const eventTypeField = document.getElementById('eventType');

  if (packageParam && detailsField) {
    const formatted = packageParam.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    detailsField.value = `Selected Package: ${formatted}\n`;

    if (eventTypeField) {
      if (packageParam.includes('wedding')) {
        eventTypeField.value = 'wedding';
      } else if (packageParam.includes('restaurant')) {
        eventTypeField.value = 'restaurant-venue';
      } else if (packageParam.includes('party') || packageParam.includes('nightlife')) {
        eventTypeField.value = 'private-party';
      } else if (packageParam.includes('corporate') || packageParam.includes('conference')) {
        eventTypeField.value = 'corporate-gala';
      }
    }
  }

  // Attempt Google Places initialization if API is already loaded
  if (window.google && window.google.maps && window.google.maps.places) {
    window.initGooglePlaces();
  }

  initQuoteForm();
});

function formatTimeLabel(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 && hours < 24 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const minStr = minutes === 0 ? '00' : String(minutes).padStart(2, '0');
  return `${hours}:${minStr} ${ampm}`;
}

function initQuoteForm() {
  const quoteForm = document.getElementById('quote-form');
  if (!quoteForm) return;

  const eventDateField = document.getElementById('eventDate');
  const startTimeSelect = document.getElementById('startTime');
  const endTimeSelect = document.getElementById('endTime');
  const durationField = document.getElementById('duration');
  const timeError = document.getElementById('time-error');
  const dateError = document.getElementById('date-error');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn') || quoteForm.querySelector('button[type="submit"]');

  // 1. Strict Date Validation: Set min attribute to today (YYYY-MM-DD)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (eventDateField) {
    eventDateField.min = todayStr;

    eventDateField.addEventListener('change', () => {
      if (eventDateField.value && eventDateField.value < todayStr) {
        if (dateError) {
          dateError.textContent = 'Event date cannot be in the past.';
          dateError.classList.add('visible');
        }
        eventDateField.value = '';
      } else if (dateError) {
        dateError.classList.remove('visible');
      }
    });
  }

  // 2. Populate Time Selects strictly in 15-minute increments (00:00 to 23:45)
  if (startTimeSelect && endTimeSelect) {
    startTimeSelect.innerHTML = '<option value="" disabled selected>Select start time</option>';
    endTimeSelect.innerHTML = '<option value="" disabled selected>Select end time</option>';

    for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += 15) {
      const label = formatTimeLabel(totalMinutes);

      const optStart = document.createElement('option');
      optStart.value = totalMinutes;
      optStart.textContent = label;
      startTimeSelect.appendChild(optStart);

      const optEnd = document.createElement('option');
      optEnd.value = totalMinutes;
      optEnd.textContent = label;
      endTimeSelect.appendChild(optEnd);
    }

    // Default suggestions (5:00 PM to 11:00 PM - 6 hours)
    startTimeSelect.value = 17 * 60;
    endTimeSelect.value = 23 * 60;

    const computeDuration = () => {
      if (!startTimeSelect.value || !endTimeSelect.value) {
        return { valid: true, minutes: 0, hours: '0', startLabel: '', endLabel: '' };
      }

      const startMin = parseInt(startTimeSelect.value, 10);
      let endMin = parseInt(endTimeSelect.value, 10);

      // Handle events going past midnight
      let durationMinutes = endMin - startMin;
      if (endMin <= startMin) {
        durationMinutes += 24 * 60;
      }

      const durationHours = (durationMinutes / 60).toFixed(1).replace(/\.0$/, '');
      const valid = durationMinutes >= 120; // Minimum 2 hours requirement

      return {
        valid,
        minutes: durationMinutes,
        hours: durationHours,
        startLabel: formatTimeLabel(startMin),
        endLabel: formatTimeLabel(endMin)
      };
    };

    const validateTimes = () => {
      const result = computeDuration();
      if (!result.valid) {
        if (timeError) {
          timeError.textContent = 'End time must be strictly after start time with a minimum duration of at least 2 hours.';
          timeError.classList.add('visible');
        }
        return false;
      } else {
        if (timeError) timeError.classList.remove('visible');
        if (durationField && result.startLabel) {
          durationField.value = `${result.hours} hours (${result.minutes} minutes: ${result.startLabel} to ${result.endLabel})`;
        }
        return true;
      }
    };

    startTimeSelect.addEventListener('change', validateTimes);
    endTimeSelect.addEventListener('change', validateTimes);
    validateTimes();

    // 3. Asynchronous Form Submission (Email Delivery)
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isTimeValid = validateTimes();
      const isDateValid = eventDateField && eventDateField.value ? (eventDateField.value >= todayStr) : false;

      if (!isDateValid) {
        if (dateError) {
          dateError.textContent = 'Please choose a valid upcoming event date.';
          dateError.classList.add('visible');
        }
        if (eventDateField) eventDateField.focus();
        return;
      }

      if (!isTimeValid) {
        endTimeSelect.focus();
        return;
      }

      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      const durInfo = computeDuration();
      if (durationField) {
        durationField.value = `${durInfo.hours} hours (${durInfo.startLabel} - ${durInfo.endLabel})`;
      }

      // Disable submit button and show "Sending..." state
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      // Clear previous status
      formStatus.className = 'form-status';
      formStatus.textContent = '';

      // Prepare form data with explicit readable values for email
      const formData = new FormData(quoteForm);
      formData.set('startTime', durInfo.startLabel);
      formData.set('endTime', durInfo.endLabel);
      formData.set('duration', `${durInfo.hours} hours (${durInfo.minutes} mins)`);

      const endpoint = quoteForm.getAttribute('action') || 'https://formspree.io/f/xjyknvky';

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          // HTTP 200 (Success): Display confirmation banner and reset form
          formStatus.className = 'form-status success';
          formStatus.innerHTML = '<strong>Quote Request Sent!</strong> Thank you, your event details have been submitted. Our event director will review your schedule and send an itemized proposal within 24 hours.';
          quoteForm.reset();
          if (eventDateField) eventDateField.min = todayStr;
          startTimeSelect.value = 17 * 60;
          endTimeSelect.value = 23 * 60;
          validateTimes();
          formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          throw new Error(`Submission rejected by service with HTTP status ${response.status}`);
        }
      } catch (err) {
        console.error('Quote submission error:', err);
        // On Error: Display error alert advising user to contact msproductionsoficial@gmail.com directly or retry
        formStatus.className = 'form-status error';
        formStatus.innerHTML = 'We could not submit your quote request online right now. Please email us directly at <a href="mailto:msproductionsoficial@gmail.com">msproductionsoficial@gmail.com</a> or retry shortly.';
        formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
}
