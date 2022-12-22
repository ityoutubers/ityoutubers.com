import React from "react";

import ChannelsList from "./ChannelsList";

import { fetchChannels } from "../../pages/api/channels.js";
import topics from "../../data/topics.json";

const secondsInHour = 60 * 60;
export const revalidate = secondsInHour;

export default async function Page() {
  const channels = await fetchChannels();

  if (!channels) return "Загружаю...";

  return <ChannelsList channels={channels} topics={topics} />;
}
