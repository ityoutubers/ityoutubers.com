import React from "react";

import { fetchTopics } from "../../pages/api/topics.js";
import List from "./List";

const secondsInDay = 60 * 60 * 24;
export const revalidate = secondsInDay;

export default async function Page() {
  const [channels, topics] = await Promise.all([
    fetch("https://ityoutubers.com/api/channels", { next: { revalidate: 900 }, signal: AbortSignal.timeout(5000) })
      .then((res) => res.json())
      .catch((error) => {
        console.error(error);
        return [];
      }),
    fetchTopics(),
  ]);

  if (!channels) return "Загружаю...";

  return <List channels={channels.filter((c) => c.isMember)} topics={topics} />;
}
