"use client";

import { useState } from "react";
import Fuse from "fuse.js";
import _ from "lodash";

import ChannelCard from "./ChannelCard";
import { orderBySubscribersDesc } from "../lib/channels";

export default function ChannelsList({ channels, topics }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");

  const sortedChannels = channels.sort(orderBySubscribersDesc);

  const topicsIds = sortedChannels.reduce((acc, cur) => {
    acc = acc.concat(cur.topics);
    return acc;
  }, []);

  const filteredTopics = topics.filter(({ id }) => topicsIds.includes(id));

  const options = {
    threshold: 0.3,
    keys: ["snippet.title", "snippet.description"],
  };
  const fuse = new Fuse(sortedChannels, options);

  const oneYearAgoDate = Date.now() - 365 * 24 * 60 * 60000;

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
        {filteredTopics.map(({ id, name }) => (
          <a
            onClick={() => setTopic(topic == id ? "" : id)}
            className={topic == id ? "topic active" : "topic"}
            key={id}
          >
            {name}
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
