import Image from "next/image";
import { toHumanString } from "human-readable-numbers";

export default function ChannelCard({ channel }) {
  const { id, snippet, statistics, isMember } = channel;

  return (
    <div className={`channel-card ${isMember ? "ityoutubers-member" : ""}`}>
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
        <a className="channel-name" href={`https://youtube.com/channel/${id}`}>
          {snippet.title} • {toHumanString(statistics.subscriberCount)}
        </a>
        <p className="line-clamp-6 text-xs">{snippet.description}</p>
      </div>
    </div>
  );
}
