// The facts about this salon that the rest of the app reads. One place.
export const salon = {
  name: "Pepper Tree Hair",
  address: "214 Alder Street, Beacon, NY 12508",
  phone: "(845) 555-0142",
  timezone: "America/New_York",
  currency: "USD",
  locale: "en-US",
  // Clients can cancel online until this many hours before the appointment.
  cancelCutoffHours: 24,
  // Start times are offered on this grid.
  slotStepMinutes: 15,
  // How far ahead a booking can be made.
  bookingWindowDays: 60,
} as const;
