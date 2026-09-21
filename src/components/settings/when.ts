import { formatDay, formatTime } from "@/lib/salon/time";

/** "Mon, Sep 21, 9:14 AM", salon time. */
export function formatWhen(instant: Date): string {
  return `${formatDay(instant, "short")}, ${formatTime(instant)}`;
}
