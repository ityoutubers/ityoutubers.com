import * as dotenv from "dotenv";
import fs from "fs/promises";
import { getTopics, getMembers, getYouTubeChannels } from "./lib/data.js";

dotenv.config({ path: "./.env.local" });

Promise.all([
  getTopics()
    .then((data) => data.sort((a, b) => (a.name > b.name ? 1 : -1)))
    .then((data) =>
      fs.writeFile("./data/topics.json", JSON.stringify(data, null, 2))
    ),
  getYouTubeChannels(getMembers(true))
    .then((data) =>
      data.map((i) => {
        i["isMember"] = true;
        return i;
      })
    )
    .then((data) =>
      fs.writeFile("./data/members.json", JSON.stringify(data, null, 2))
    ),
  getYouTubeChannels(getMembers(false)).then((data) =>
    fs.writeFile("./data/channels.json", JSON.stringify(data, null, 2))
  ),
]).catch(console.error);
