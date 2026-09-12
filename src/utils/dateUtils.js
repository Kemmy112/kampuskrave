// Shared calendar-day helpers so "today" means the same thing everywhere —
// order resets, menu resets, etc. — instead of each file rolling its own
// slightly different definition (e.g. a 24h rolling window vs a real
// calendar-day boundary).

export function todayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function dateStringOf(timestamp) {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isToday(timestamp) {
  return dateStringOf(timestamp) === todayDateString();
}