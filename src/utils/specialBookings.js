// Booking-date rules for Special (pre-order) dishes. The chef requires at
// least 24 hours' notice, enforced via a daily cutoff rather than a raw
// "24 hours from now" countdown:
//   - Order placed BEFORE the cutoff on day X → earliest fulfillment is day X+1
//   - Order placed AT/AFTER the cutoff on day X → earliest fulfillment is day X+2
// (Ordering right at 5:59pm for "tomorrow" would only give ~24hrs notice;
// ordering at 6:01pm for "tomorrow" would give under 24hrs, hence the push
// to day X+2 once the cutoff has passed.)

export const SPECIAL_BOOKING_CUTOFF_HOUR = 18; // 6:00 PM, 24-hour clock

// Returns a Date (midnight local time) for the earliest day a Special
// order can be fulfilled, based on the current time and the daily cutoff.
export function getEarliestSpecialDate(now = new Date()) {
  const cutoffToday = new Date(now);
  cutoffToday.setHours(SPECIAL_BOOKING_CUTOFF_HOUR, 0, 0, 0);

  const daysAhead = now < cutoffToday ? 1 : 2;

  const earliest = new Date(now);
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() + daysAhead);
  return earliest;
}

// Formats a Date as YYYY-MM-DD for use as the `min` attribute on an
// <input type="date">, and for matching against a date input's value.
export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Human-readable version for display, e.g. "Thu, 11 Sep".
export function formatBookingDate(dateStringOrDate) {
  const date =
    typeof dateStringOrDate === 'string' ? new Date(`${dateStringOrDate}T00:00:00`) : dateStringOrDate;
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

// Validates a YYYY-MM-DD date string against the current earliest-allowed
// date. Returns true if it's a valid, sufficiently-advance booking date.
export function isValidBookingDate(dateString, now = new Date()) {
  if (!dateString) return false;
  const earliest = getEarliestSpecialDate(now);
  const selected = new Date(`${dateString}T00:00:00`);
  return selected >= earliest;
}