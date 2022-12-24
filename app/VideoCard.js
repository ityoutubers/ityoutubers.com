import Image from "next/image";

export default function VideoCard({ channel }) {
  const { isMember, lastVideo } = channel;

  return (
    <div
      className={`${
        isMember ? "ityoutubers-member" : ""
      } text-sm leading-normal relative`}
    >
      <span className="ityoutubers-logo"></span>
      <a
        className="video-thumbnail not-prose"
        href={`https://www.youtube.com/watch?v=${lastVideo.id}`}
        style={{
          backgroundImage: `url(${lastVideo.thumbnail.url})`,
        }}
      ></a>
      <a
        className="video-title line-clamp-2"
        href={`https://www.youtube.com/watch?v=${lastVideo.id}`}
      >
        <Image
          src={channel.snippet.thumbnails.medium.url}
          height={30}
          width={30}
          alt=""
        />{" "}
        {lastVideo.title}
      </a>
    </div>
  );
}
