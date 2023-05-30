import React from "react";

import ChannelsList from "./ChannelsList";

import { fetchTopics } from "../../pages/api/topics.js";

const secondsInHour = 60 * 60;
export const revalidate = secondsInHour;

export default async function Page() {
  const [channels, topics] = await Promise.all([
    fetch("https://ityoutubers.com/api/channels", { next: { revalidate: 900 } })
      .then((res) => res.json())
      .catch((error) => {
        console.error(error);
        return [];
      }),
    fetchTopics(),
  ]);

  if (!channels) return "Загружаю...";

  return <ChannelsList channels={channels} topics={topics} />;
}
