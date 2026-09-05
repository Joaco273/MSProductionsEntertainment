// Dynamic copyright year
const yearSpan = document.getElementById('current-year');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Mobile Navigation Drawer Toggle
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

if (mobileToggle && navMenu) {
  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });
}

// Google Places Autocomplete API Integration
window.initGooglePlaces = function() {
  const input = document.getElementById('venueLocation');
  if (!input) return;

  try {
    if (window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'name', 'geometry']
      });

      autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          input.value = place.name ? `${place.name}, ${place.formatted_address}` : place.formatted_address;
        }
      });
    }
  } catch (err) {
    console.warn('Google Places API initialized with default fallback:', err);
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

  // Attempt Google Places initialization if API already loaded
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
  const eventDateField = document.getElementById('eventDate');
  const startTimeSelect = document.getElementById('startTime');
  const endTimeSelect = document.getElementById('endTime');
  const timeError = document.getElementById('time-error');
  const dateError = document.getElementById('date-error');
  const quoteForm = document.getElementById('quote-form');
  const formStatus = document.getElementById('form-status');

  if (!quoteForm) return;

  // 1. Strict Date Validation: Set min attribute to today (YYYY-MM-DD)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (eventDateField) {
    eventDateField.min = todayStr;

    eventDateField.addEventListener('change', () => {
      if (eventDateField.value < todayStr) {
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

    // Default suggestions (e.g. 5:00 PM to 11:00 PM - 6 hours)
    startTimeSelect.value = 17 * 60;
    endTimeSelect.value = 23 * 60;

    const validateTimes = () => {
      if (!startTimeSelect.value || !endTimeSelect.value) return true;
      
      const startMin = parseInt(startTimeSelect.value, 10);
      let endMin = parseInt(endTimeSelect.value, 10);

      // Handle events going past midnight
      let duration = endMin - startMin;
      if (endMin <= startMin) {
        duration += 24 * 60;
      }

      if (duration < 120) {
        if (timeError) {
          timeError.textContent = 'End time must be strictly after start time with a minimum duration of at least 2 hours.';
          timeError.classList.add('visible');
        }
        return false;
      } else {
        if (timeError) timeError.classList.remove('visible');
        return true;
      }
    };

    startTimeSelect.addEventListener('change', validateTimes);
    endTimeSelect.addEventListener('change', validateTimes);

    // Form Submission Verification
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const isTimeValid = validateTimes();
      const isDateValid = eventDateField ? (eventDateField.value >= eventDateField.min) : true;

      if (!isDateValid) {
        if (dateError) {
          dateError.textContent = 'Please choose an upcoming event date.';
          dateError.classList.add('visible');
        }
        eventDateField.focus();
        return;
      }

      if (!isTimeValid) {
        endTimeSelect.focus();
        return;
      }

      // Check standard form constraints
      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      // Successful submission presentation
      if (formStatus) {
        formStatus.className = 'form-status success';
        formStatus.textContent = 'Thank you! Your quote request has been verified and submitted. Our event director will send your proposal within 24 hours.';
        quoteForm.reset();
        if (eventDateField) eventDateField.min = todayStr;
        startTimeSelect.value = 17 * 60;
        endTimeSelect.value = 23 * 60;

        setTimeout(() => {
          formStatus.className = 'form-status';
          formStatus.textContent = '';
        }, 8000);
      }
    });
  }
}
