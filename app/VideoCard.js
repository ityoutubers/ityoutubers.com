import Image from "next/image";

export default function VideoCard({ channel }) {
  const { id, snippet, statistics, isMember, lastVideo } = channel;

  return (
    <div className="text-sm leading-normal relative">
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
      <a className="" href={`https://www.youtube.com/watch?v=${lastVideo.id}`}>
        {lastVideo.title}
      </a>
    </div>
  );
}
