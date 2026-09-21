// How to connect an agent. Shown at the top of Connected apps and again in its
// empty state, so the two can never drift apart.
export const CLAUDE_CODE_COMMAND = (address: string) =>
  `claude mcp add --transport http pepper-tree ${address}`;

export function ConnectInstructions({ address }: { address: string }) {
  return (
    <ul className="grid max-w-[62ch] gap-2 text-sm text-muted-foreground">
      <li>
        In Claude Code, run{" "}
        <code className="figures break-all text-foreground">{CLAUDE_CODE_COMMAND(address)}</code>{" "}
        then type <code className="figures text-foreground">/mcp</code> to sign in.
      </li>
      <li>
        On claude.ai it goes under Settings, Connectors, Add custom connector. That works once
        the site is deployed, because claude.ai cannot reach a computer on your desk.
      </li>
    </ul>
  );
}
