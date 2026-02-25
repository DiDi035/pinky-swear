import "dotenv/config";
import { startIndexer } from "./indexer";

startIndexer().catch((error) => {
  console.error(error);
});
