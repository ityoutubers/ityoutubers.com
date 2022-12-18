"use client";

import Image from "next/image";
import React, { useState } from "react";
import _ from "lodash";
import Link from "next/link";
import { toHumanString } from "human-readable-numbers";

import channels from "../../data/channels.json";
import topics from "../../data/topics.json";

export default function Page() {
  const [topic, setTopic] = useState("");

  const channelsSortedBySubs = channels
    .sort((a, b) =>
      parseInt(a.statistics.subscriberCount) >
      parseInt(b.statistics.subscriberCount)
        ? -1
        : 1
    )
    .filter((c) => !topic || c.topics.includes(topic));

  return (
    <>
      <p className="italic">
        Авторы каналов с этой страницы{" "}
        <em className="text-rose-700">не входят в сообщество</em> и не имеют к
        сообществу никакого отношения. Мы ведем список интересных и полезных
        каналов, чтобы вы могли получить всю информацию в одном месте. Вы тоже
        можете{" "}
        <Link href="https://github.com/ityoutubers/ityoutubers.com/issues/new?assignees=nLight&labels=&template=CHANNEL.yml&title=%5B%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB%5D%3A+">
          добавить канал в этот список
        </Link>
        .
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

      <div id="channels" className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {channelsSortedBySubs.map(({ id, snippet, statistics }) => (
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
