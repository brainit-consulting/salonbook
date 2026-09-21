// What a settings action hands back to the button that called it.
export type SettingsResult = { ok: true } | { ok: false; error: string };
