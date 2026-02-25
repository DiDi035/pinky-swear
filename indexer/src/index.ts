import "dotenv/config";
import { startApi } from "./api";
import { startIndexer } from "./indexer";
import { startListeners } from "./listeners";

async function main() {
  await startIndexer();
  await startListeners();
  startApi();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
