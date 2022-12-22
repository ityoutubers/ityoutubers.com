import React from "react";

import { fetchChannels } from "../pages/api/channels.js";
import { fetchTopics } from "../pages/api/topics.js";
import ChannelsList from "./ChannelsList";

const secondsInDay = 60 * 60 * 24;
export const revalidate = secondsInDay;

export default async function Page() {
  const [channels, topics] = await Promise.all([
    fetchChannels(),
    fetchTopics(),
  ]);

  if (!channels) return "Загружаю...";

  return (
    <ChannelsList
      channels={channels.filter((c) => c.isMember)}
      topics={topics}
    />
  );
}
