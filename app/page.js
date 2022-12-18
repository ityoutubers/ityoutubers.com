"use client";

import Image from "next/image";
import React, { useState } from "react";
import _ from "lodash";
import { toHumanString } from "human-readable-numbers";

import channels from "../data/members.json";
import topics from "../data/topics.json";

export default function Page() {
  const oneYearAgoDate = Date.now() - 365 * 24 * 60 * 60000;

  const [topic, setTopic] = useState("");

  const channelsSortedBySubs = channels
    .sort((a, b) =>
      parseInt(a.statistics.subscriberCount) >
      parseInt(b.statistics.subscriberCount)
        ? -1
        : 1
    )
    .filter((c) => !topic || c.topics.includes(topic));

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
        расходятся по многим вопросам, мы стараемся фокусироваться на IT.
      </p>

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

      <div
        id="channels"
        className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12"
      >
        {activeChannels.map(({ id, snippet, statistics }) => (
          <div key={id} className="">
            <div className="float-left not-prose pr-10">
              <a href={`https://youtube.com/channel/${id}`}>
                <Image
                  width={144}
                  height={144}
                  alt=""
                  className="rounded-full"
                  src={snippet.thumbnails.medium.url}
                />
              </a>
            </div>
            <div className="">
              <a href={`https://youtube.com/channel/${id}`}>
                {snippet.title} • {toHumanString(statistics.subscriberCount)}
              </a>
              <p className="line-clamp-6 text-xs">{snippet.description}</p>
            </div>
          </div>
        ))}
      </div>

      {inactiveChannels.length > 0 ? (
        <h2>Каналы, которые больше года не выпускают видео</h2>
      ) : (
        <></>
      )}

      <div id="channels" className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {inactiveChannels.map(({ id, snippet, statistics }) => (
          <div key={id} className="grid grid-cols-3 gap-8">
            <div className="col-span-1 not-prose">
              <a href={`https://youtube.com/channel/${id}`}>
                <Image
                  width={144}
                  height={144}
                  alt=""
                  className="rounded-full"
                  src={snippet.thumbnails.medium.url}
                />
              </a>
            </div>
            <div className="col-span-2">
              <a href={`https://youtube.com/channel/${id}`}>
                {snippet.title} • {toHumanString(statistics.subscriberCount)}
              </a>
              <p className="line-clamp-4 mt-2 text-xs">{snippet.description}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
