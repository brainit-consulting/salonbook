import type { BookingDetail } from "./bookings";

// The emails a booking owes people. bookings.ts calls these after the booking
// is saved and never waits on the result.
export async function notifyBooked(booking: BookingDetail): Promise<void> {
  void booking;
}

export async function notifyCancelled(booking: BookingDetail): Promise<void> {
  void booking;
}
