import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  name: string;
  label: string;
  hint?: string;
};

/** Label above, input below, 44px tall so it is easy to hit on a phone. */
export function Field({ name, label, hint, ...props }: FieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="font-semibold">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        aria-describedby={hintId}
        className="h-11 bg-card"
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** The server's own words when something is refused. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="border-l-[3px] border-destructive pl-3 text-sm text-destructive">
      {message}
    </p>
  );
}
