import { getMembers, getYouTubeChannels } from "../../lib/data";
import c from "../../data/channels.json";
import m from "../../data/members.json";

export async function fetchChannels() {
  if (process.env.USE_MOCK == "true") {
    return [...m, ...c];
  }

  const [members, channels] = await Promise.all([
    getYouTubeChannels(getMembers(true)).then((data) =>
      data.map((i) => {
        i["isMember"] = true;
        return i;
      })
    ),
    getYouTubeChannels(getMembers(false)),
  ]).catch((e) => console.error(e));

  return [...members, ...channels];
}

export default async function handler(req, res) {
  res.status(200).json([]);
}
