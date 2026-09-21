import { cn } from "cn";
import { formatDay, formatDuration, formatMoney, formatTime } from "@/lib/salon/time";

type Props = {
  serviceName: string;
  stylistName: string;
  startsAt: Date;
  durationMinutes: number;
  priceCents: number;
  // A cancelled booking is struck through in muted ink, not painted red.
  struck?: boolean;
};

export function BookingSummary(props: Props) {
  const rows: [string, string, boolean][] = [
    ["Service", props.serviceName, false],
    ["Stylist", props.stylistName, false],
    ["Day", formatDay(props.startsAt), false],
    ["Time", formatTime(props.startsAt), true],
    ["Length", formatDuration(props.durationMinutes), true],
    ["Price", formatMoney(props.priceCents), true],
  ];
  return (
    <dl className={cn("border-t", props.struck && "text-muted-foreground line-through")}>
      {rows.map(([label, value, figures]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b py-2.5">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className={cn("text-right", figures && "figures")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
