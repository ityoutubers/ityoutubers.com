import * as dotenv from "dotenv";
import fs from "fs/promises";
import { getTopics, getYouTubeChannels } from "./lib/data.js";

dotenv.config({ path: "./.env.local" });

await getYouTubeChannels()
  .then(() => console.log("done"))
  .then(() => setTimeout(() => process.exit(0), 1000 * 60)); // 1 minute timeout, don't want to deal with it now
