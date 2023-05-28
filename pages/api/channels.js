import { MongoClient } from "mongodb";

const mongo = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  await mongo.connect();

  const db = mongo.db("ityoutubers");

  await db.collection("channels")
    .find()
    .toArray()
    .then((channels) => {
      res.status(200).json(channels);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}
