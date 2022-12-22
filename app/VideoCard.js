import Image from "next/image";

export default function VideoCard({ channel }) {
  const { isMember, lastVideo } = channel;

  return (
    <div
      className={`${
        isMember ? "ityoutubers-member" : ""
      } text-sm leading-normal relative`}
    >
      <a
        className="not-prose block"
        href={`https://www.youtube.com/watch?v=${lastVideo.id}`}
      >
        <Image
          alt={lastVideo.title}
          src={lastVideo.thumbnail.url}
          height={lastVideo.thumbnail.height}
          width={lastVideo.thumbnail.width}
        />
      </a>
      <a
        className="video-title"
        href={`https://www.youtube.com/watch?v=${lastVideo.id}`}
      >
        {lastVideo.title}
      </a>
    </div>
  );
}
