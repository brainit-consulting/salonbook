// Turns a browser's user-agent string into "Chrome on Windows". A short lookup,
// not a parser: order matters because Edge and Opera also say "Chrome", and
// Chrome also says "Safari".
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "Mac"],
  [/CrOS/, "Chromebook"],
  [/Linux/, "Linux"],
];

export function deviceName(userAgent: string | null | undefined): string {
  if (!userAgent) return "A device that did not say what it is";
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  if (browser && system) return `${browser} on ${system}`;
  // Command-line tools and scripts: show the first word of what they sent.
  return browser ?? system ?? userAgent.split(/[\s/]/)[0].slice(0, 40);
}
