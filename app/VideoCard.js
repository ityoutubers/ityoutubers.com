export default function VideoCard({ channel }) {
  const { isMember, lastVideo } = channel;

  return (
    <div
      className={`${
        isMember ? "ityoutubers-member" : ""
      } text-sm leading-normal relative`}
    >
      <a
        className="video-thumbnail not-prose"
        href={`https://www.youtube.com/watch?v=${lastVideo.id}`}
        style={{
          backgroundImage: `url(${lastVideo.thumbnail.url})`,
        }}
      ></a>
      <a
        className="video-title"
        href={`https://www.youtube.com/watch?v=${lastVideo.id}`}
      >
        {lastVideo.title}
      </a>
    </div>
  );
}
