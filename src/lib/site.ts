export const siteUrl = (
  process.env.APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

export const site = {
  name: "Pepper Tree Hair",
  description:
    "Book a cut, color or blow-dry at Pepper Tree Hair. Pick a service, a stylist and a time.",
};
