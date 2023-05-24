"use client";

import Image from "next/image";
import _ from "lodash";

import { orderBySubscribersDesc } from "../../lib/channels";

import members from "../../data/members.json";

export default function Page() {
  const channelsSortedBySubs = [...members].sort(orderBySubscribersDesc);

  return (
    <>
      <p className="italic">Все каналы кружочками. И сообщество, и не очень.</p>
      <div id="channels" className="overflow-hidden">
        {channelsSortedBySubs.map(({ id, snippet, statistics }) => (
          <div key={id} className="float-left not-prose">
            <a href={`https://youtube.com/channel/${id}`}>
              <Image
                width={50}
                height={50}
                alt=""
                className="rounded-full"
                src={snippet.thumbnails.medium.url}
              />
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
