"use client";
import Image from "next/image";

import { useState } from "react";
import Fuse from "fuse.js";
import _ from "lodash";

import { orderBySubscribersDesc } from "../../lib/channels";

export default function ChannelsList({ channels, topics }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");

  const sortedChannels = channels
    .sort(orderBySubscribersDesc)
    .filter((channel) => !!channel.course?.title);

  const topicsIds = sortedChannels.reduce((acc, cur) => {
    acc = acc.concat(cur.topics);
    return acc;
  }, []);

  const filteredTopics = topics.filter(({ id }) => topicsIds.includes(id));

  const options = {
    threshold: 0.3,
    keys: ["snippet.title", "course.title", "course.description"],
  };
  const fuse = new Fuse(sortedChannels, options);

  const channelsSortedBySubs = (
    query ? fuse.search(query).map((i) => i.item) : sortedChannels
  ).filter((c) => !topic || c.topics.includes(topic));

  return (
    <>
      <p className="italic">
        Здесь вы найдете обучающие материалы и курсы от участников сообщества.
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

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {channelsSortedBySubs.map(({ id, snippet, course }) => (
          <div key={id} className={`channel-card--learn`}>
            <div className="not-prose mr-5">
              <a href={`https://youtube.com/channel/${id}`}>
                <Image
                  alt=""
                  width={144}
                  height={144}
                  className="rounded-full"
                  src={snippet.thumbnails.medium.url}
                  onError={(e) => (e.target.src = "/oops.png")}
                />
              </a>
            </div>
            <div className="">
              <a className="channel-name" href={course.url}>
                {course.title}
              </a>
              <p className="line-clamp-6 text-xs">{course.description}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
