"use client";

import React, { useState } from "react";
import _ from "lodash";
import Link from "next/link";
import Fuse from "fuse.js";
import useSWR from "swr";

import ChannelCard from "../ChannelCard";
import VideoCard from "../VideoCard";

import {
  orderBySubscribersDesc,
  orderByVideoDateDesc,
} from "../../lib/channels";

import topics from "../../data/topics.json";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Page() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [channelVideo, setChannelVideo] = useState("channels");
  const [sortOrder, setSortOrder] = useState("subscribers");

  const { data: channels, error } = useSWR("/api/channels", fetcher);

  if (!channels) return "Загружаю...";

  const options = {
    threshold: 0.3,
    keys: ["snippet.title", "snippet.description", "lastVideo.title"],
  };
  const fuse = new Fuse(channels, options);

  const sortedChannels = channels.sort(
    sortOrder == "subscribers" ? orderBySubscribersDesc : orderByVideoDateDesc
  );

  const filteredChannels = (
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

      <div className="mb-3">
        Показать:{" "}
        <a
          className={`list-control ${
            channelVideo == "channels" ? "active" : ""
          }`}
          onClick={() => setChannelVideo("channels")}
        >
          Каналы
        </a>{" "}
        |{" "}
        <a
          className={`list-control ${channelVideo == "video" ? "active" : ""}`}
          onClick={() => setChannelVideo("video")}
        >
          Видео
        </a>{" "}
        cортировать по:{" "}
        <a
          className={`list-control ${
            sortOrder == "subscribers" ? "active" : ""
          }`}
          onClick={() => setSortOrder("subscribers")}
        >
          популярности
        </a>{" "}
        |{" "}
        <a
          className={`list-control ${sortOrder == "lastVideo" ? "active" : ""}`}
          onClick={() => setSortOrder("lastVideo")}
        >
          дате последнего видео
        </a>
      </div>

      <div className="mb-5">
        <input
          className="w-full"
          placeholder="Поиск по названию и описанию каналов, а так же по заголовку видео"
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
        {filteredChannels.map((channel) =>
          channelVideo == "channels" ? (
            <ChannelCard key={channel.id} channel={channel} />
          ) : (
            <VideoCard key={channel.id} channel={channel} />
          )
        )}
      </div>
    </>
  );
}
