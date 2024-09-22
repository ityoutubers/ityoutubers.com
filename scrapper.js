import * as dotenv from "dotenv";
import { getYouTubeChannels } from "./lib/data.js";

dotenv.config({ path: "./.env.local" });

await getYouTubeChannels()
  .then(() => console.log("done"))
  .then(() =>
    setTimeout(() => {
      console.log("Process didn't exit, aborting");
      process.abort();
    }, 1000 * 10)
  ); // 1 minute timeout, don't want to deal with it now
