import { getMembers, getYouTubeChannels } from "../../lib/data";
import c from "../../data/channels.json";
import m from "../../data/members.json";

export async function fetchChannels() {
  if (process.env.USE_MOCK == "true") {
    return [...m, ...c];
  }

  const channels = await getYouTubeChannels().catch((e) => console.error(e));

  return channels;
}

export default async function handler(req, res) {
  res.status(200).json([]);
}
