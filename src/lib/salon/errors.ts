// Things that can go wrong for a reason a person can act on. The message is
// written to be shown as is, on a page or back to an AI agent.
export type SalonErrorCode =
  | "not_found"
  | "invalid"
  | "slot_taken"
  | "too_late_to_cancel"
  | "already_cancelled";

export class SalonError extends Error {
  constructor(
    public code: SalonErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SalonError";
  }
}
