import React from "react";

import ChannelsList from "./ChannelsList";

import { fetchChannels } from "../../pages/api/channels.js";
import { fetchTopics } from "../../pages/api/topics.js";

const secondsInHour = 60 * 60;
export const revalidate = secondsInHour;

export default async function Page() {
  const [channels, topics] = await Promise.all([
    fetchChannels(),
    fetchTopics(),
  ]);

  if (!channels) return "Загружаю...";

  return <ChannelsList channels={channels} topics={topics} />;
}
