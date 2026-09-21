const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ids arrive from web addresses and from AI agents. Anything that is not
// shaped like an id is treated as "not found" before it reaches the database.
export function isId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
