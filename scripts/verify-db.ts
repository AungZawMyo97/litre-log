import "dotenv/config";
import { db, systemSettings } from "@/lib/db";

async function main() {
  const rows = await db.select().from(systemSettings).limit(1);
  console.log(`✅ Connected (${rows.length} setting row(s) readable).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
