"use strict";

/* Mobile navigation */
const navToggle = document.querySelector(".nav-toggle");
const navigation = document.querySelector("#primary-navigation");

function setNavigation(open) {
  if (!navToggle || !navigation) return;

  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation"
  );
  navigation.classList.toggle("is-open", open);
}

if (navToggle && navigation) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setNavigation(!isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavigation(false));
  });

  document.addEventListener("click", (event) => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    const clickedOutside =
      !navigation.contains(event.target) &&
      !navToggle.contains(event.target);

    if (isOpen && clickedOutside) setNavigation(false);
  });

  document.addEventListener("keydown", (event) => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";

    if (event.key === "Escape" && isOpen) {
      setNavigation(false);
      navToggle.focus();
    }
  });
}

/* Footer year and email link */
const yearElement = document.querySelector("#current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const reservationEmail = document.body.dataset.reservationEmail;
const emailLink = document.querySelector("[data-email-link]");

if (emailLink && reservationEmail) {
  emailLink.href = `mailto:${reservationEmail}`;
  emailLink.textContent = reservationEmail;
}

/* Reservation form */
const reservationForm = document.querySelector("#reservation-form");

if (reservationForm) {
  const nameField = document.querySelector("#reservation-name");
  const phoneField = document.querySelector("#reservation-phone");
  const dateField = document.querySelector("#reservation-date");
  const statusMessage = document.querySelector("#reservation-status");
  const submitButton = reservationForm.querySelector('[type="submit"]');

  const fields = {
    name: nameField,
    phone: phoneField,
    date: dateField,
    time: document.querySelector("#reservation-time"),
    guests: document.querySelector("#reservation-guests"),
    notes: document.querySelector("#reservation-notes")
  };

  function getLocalDate() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  }

  dateField.min = getLocalDate();

  Object.values(fields).forEach((field) => {
    if (!field) return;

    field.addEventListener("input", () => field.setCustomValidity(""));
    field.addEventListener("change", () => field.setCustomValidity(""));
  });

  function validateForm() {
    Object.values(fields).forEach((field) => {
      if (field) field.setCustomValidity("");
    });

    const name = nameField.value.trim();
    const phone = phoneField.value.trim();
    const phoneDigits = phone.replace(/\D/g, "");

    if (name.length < 2 || name.length > 80) {
      nameField.setCustomValidity("Enter a name between 2 and 80 characters.");
    }

    if (
      !/^\+?[0-9 ().-]{8,24}$/.test(phone) ||
      phoneDigits.length < 8 ||
      phoneDigits.length > 15
    ) {
      phoneField.setCustomValidity("Enter a valid phone number.");
    }

    if (dateField.value && dateField.value < getLocalDate()) {
      dateField.setCustomValidity("Choose today or a future date.");
    }

    return reservationForm.reportValidity();
  }

  reservationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    statusMessage.textContent = "";
    statusMessage.classList.remove("is-success");

    if (!validateForm()) return;

    submitButton.disabled = true;
    reservationForm.setAttribute("aria-busy", "true");

    try {
      const formData = Object.fromEntries(new FormData(reservationForm));

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        statusMessage.textContent =
          result.error || "We could not submit your reservation.";

        if (result.fieldErrors) {
          let firstInvalidField = null;

          for (const [fieldName, message] of Object.entries(
            result.fieldErrors
          )) {
            const field = fields[fieldName];

            if (field) {
              field.setCustomValidity(message);
              firstInvalidField ||= field;
            }
          }

          if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.reportValidity();
          }
        }

        return;
      }

      reservationForm.reset();
      dateField.min = getLocalDate();

      statusMessage.textContent =
        result.message || "Your reservation request has been saved.";
      statusMessage.classList.add("is-success");
    } catch {
      statusMessage.textContent =
        "Unable to connect. Please check your connection or call the restaurant.";
    } finally {
      submitButton.disabled = false;
      reservationForm.setAttribute("aria-busy", "false");
    }
  });
}