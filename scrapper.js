import * as dotenv from "dotenv";
import whyIsNodeRunning from "why-is-node-running";
import { getYouTubeChannels } from "./lib/data.js";

dotenv.config({ path: "./.env.local" });

await getYouTubeChannels().then(() => console.log("done"));
