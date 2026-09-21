// The one hardcoded colour in the app, on purpose: an unset legal detail has
// to look like it does not belong, in both themes, so nobody ships it.
export function Blank({ field }: { field: string }) {
  return (
    <mark className="rounded bg-yellow-200 px-1 text-black dark:bg-yellow-300">
      Needs your details — set <code>{field}</code> in <code>src/lib/legal.ts</code>
    </mark>
  );
}
