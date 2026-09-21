// Imported for its side effect, and always first: the database module builds
// its pool when it is imported, so the env has to be loaded before that.
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set. Check .env.");
}
