"use client";

import React, { useState } from "react";
import _ from "lodash";
import Fuse from "fuse.js";

import { orderBySubscribersDesc } from "../lib/channels";

import ChannelCard from "./ChannelCard";

import channels from "../data/members.json";
import topics from "../data/topics.json";

const sortedChannels = channels.sort(orderBySubscribersDesc);

const options = {
  threshold: 0.3,
  keys: ["snippet.title", "snippet.description"],
};
const fuse = new Fuse(sortedChannels, options);

export default function Page() {
  const oneYearAgoDate = Date.now() - 365 * 24 * 60 * 60000;

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");

  const channelsSortedBySubs = (
    query ? fuse.search(query).map((i) => i.item) : sortedChannels
  ).filter((c) => !topic || c.topics.includes(topic));

  const [activeChannels, inactiveChannels] = _.partition(
    channelsSortedBySubs,
    (channel) =>
      channel.lastVideo?.publishedAt &&
      Date.parse(channel.lastVideo?.publishedAt) > oneYearAgoDate
  );

  return (
    <>
      <p className="italic">
        ITYouTubers — сообщество каналов с IT контентом. Мы собрались, чтобы
        сделать IT контент лучше и доступнее. Мнения участников наверняка
        расходятся по многим вопросам, мы стараемся фокусироваться на IT. Если
        вы хотите присоединиться к сообществу — напишите @soexpired в телеграме.
      </p>

      <div className="mb-5">
        <input
          className="w-full"
          placeholder="Поиск"
          value={query}
          type="text"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="topics mb-10">
        {topics.map((t) => (
          <a
            onClick={() => setTopic(topic == t.id ? "" : t.id)}
            className={topic == t.id ? "topic active" : "topic"}
            key={t.id}
          >
            {t.name}
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
        {activeChannels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>

      {inactiveChannels.length > 0 ? (
        <h2>Каналы, которые больше года не выпускают видео</h2>
      ) : (
        <></>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {inactiveChannels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>
    </>
  );
}
