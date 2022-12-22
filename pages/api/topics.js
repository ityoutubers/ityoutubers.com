import { getTopics } from "../../lib/data";
import t from "../../data/topics.json";

export async function fetchTopics() {
  if (process.env.USE_MOCK) {
    return t;
  }

  return await getTopics().then((data) =>
    data.sort((a, b) => (a.name > b.name ? 1 : -1))
  );
}

export default async function handler(req, res) {
  res.status(200).json([]);
}
