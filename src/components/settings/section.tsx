import { cn } from "cn";

// One sheet per concern, each with its own save button. No shadow, 1px rule.
export function SettingsSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("border bg-card p-4 text-card-foreground sm:p-6", className)}>
      <h2 className="text-2xl">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-[62ch] text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function PageHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="double-rule text-[1.75rem]">{children}</h1>;
}
