import type { ReactNode } from "react";
import { Body, Container, Head, Hr, Html, Preview, Text } from "react-email";

// Shared frame for every email the salon sends. Email clients ignore the app's
// CSS variables, so the DESIGN.md values are written out literally here.
export const ink = "#211C17";
export const paper = "#F5EFE4";
export const sheet = "#FBF7EF";
export const rule = "#CFC4B0";
export const quiet = "#6B6053";
export const pepper = "#9E2F45";

export const buttonStyle = {
  background: pepper,
  color: sheet,
  padding: "12px 20px",
  borderRadius: 2,
  fontWeight: 600,
  textDecoration: "none",
} as const;

export function Shell({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: paper, color: ink, fontFamily: "Georgia, serif", margin: 0 }}>
        <Container style={{ maxWidth: 480, padding: "32px 20px" }}>
          <Text style={{ fontSize: 26, margin: 0 }}>Pepper Tree Hair</Text>
          <Hr style={{ borderColor: rule, margin: "12px 0 24px" }} />
          {children}
          <Hr style={{ borderColor: rule, margin: "24px 0 12px" }} />
          <Text style={{ color: quiet, fontSize: 13, margin: 0 }}>
            Pepper Tree Hair is a made-up salon used for a workshop demo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
