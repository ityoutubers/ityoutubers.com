"use client";

import React, { useState } from "react";
import _ from "lodash";
import Link from "next/link";
import Fuse from "fuse.js";

import ChannelCard from "../ChannelCard";

import { orderBySubscribersDesc } from "../../lib/channels";

import members from "../../data/members.json";
import channels from "../../data/channels.json";
import topics from "../../data/topics.json";

const sortedChannels = [...channels, ...members].sort(orderBySubscribersDesc);

const options = {
  threshold: 0.3,
  keys: ["snippet.title", "snippet.description"],
};
const fuse = new Fuse(sortedChannels, options);

export default function Page() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");

  const channelsSortedBySubs = (
    query ? fuse.search(query).map((i) => i.item) : sortedChannels
  ).filter((c) => !topic || c.topics.includes(topic));

  return (
    <>
      <p className="italic">
        В дополнение к участникам сообщества, на этой странице есть другие
        каналы, авторы которых{" "}
        <em className="text-rose-700">не входят в сообщество</em> и не имеют к
        сообществу никакого отношения. Мы ведем список интересных и полезных
        каналов, чтобы вы могли получить всю информацию в одном месте. Вы тоже
        можете{" "}
        <Link href="https://github.com/ityoutubers/ityoutubers.com/issues/new?assignees=nLight&labels=&template=CHANNEL.yml&title=%5B%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB%5D%3A+">
          добавить канал в этот список
        </Link>
        .
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

      <div id="channels" className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {channelsSortedBySubs.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>
    </>
  );
}
