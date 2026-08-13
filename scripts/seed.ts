import "dotenv/config";
import { seedDefaultSettings } from "@/lib/settings";

async function main() {
  await seedDefaultSettings();
  console.log("Seeded default system settings.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
