import channels from "../../data/channels.json";
import members from "../../data/members.json";

export default function handler(req, res) {
  res.status(200).json([...members, ...channels]);
}
