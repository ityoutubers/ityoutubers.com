import React from "react";

import { fetchChannels } from "../pages/api/channels.js";
import topics from "../data/topics.json";
import ChannelsList from "./ChannelsList";

const secondsInDay = 60 * 60 * 24;
export const revalidate = secondsInDay;

export default async function Page() {
  const channels = await fetchChannels();

  if (!channels) return "Загружаю...";

  return (
    <ChannelsList
      channels={channels.filter((c) => c.isMember)}
      topics={topics}
    />
  );
}
