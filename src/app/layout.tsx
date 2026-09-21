import type { Metadata } from "next";
import { Familjen_Grotesk, Instrument_Serif, Spline_Sans_Mono } from "next/font/google";
import { site, siteUrl } from "@/lib/site";
import "./globals.css";

const body = Familjen_Grotesk({ variable: "--font-body", subsets: ["latin"] });
const display = Instrument_Serif({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const figures = Spline_Sans_Mono({ variable: "--font-figures", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  // A workshop demo, kept out of search on purpose. This and src/app/robots.ts
  // are the two switches to change if the site ever goes public.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} ${figures.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
