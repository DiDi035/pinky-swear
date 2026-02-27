import "dotenv/config";
import { startApi } from "./api";
import { startIndexer } from "./indexer";
import { startListeners } from "./listeners";
import { startDetectors } from "./reorg_detectors";

async function main() {
  await startIndexer();
  startListeners();
  startDetectors();
  startApi();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
