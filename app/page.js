import Head from 'next/head'
import Image from 'next/image'
import _ from 'lodash'

function humanNumber (value) {
  const num = parseInt(value, 10);
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function(item) {
    return num >= item.value;
  });
  return item ? (num / item.value).toFixed(0).replace(rx, "$1") + item.symbol : "0";
}

async function getData() {
  const res = await fetch(`${process.env.HOST}/api/channels`, { next: {revalidate: 24 * 60 * 60}});

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  return res.json();
}

export default async function Page() {
  const channels = await getData();
  const oneYearAgoDate = Date.now() - 365 * 24 * 60 * 60000;
  const channelsSortedBySubs = channels.sort((a, b) => parseInt(a.statistics.subscriberCount) > parseInt(b.statistics.subscriberCount) ? -1 : 1)
  const [activeChannels, inactiveChannels] = _.partition(channelsSortedBySubs, (channel) => 
    channel.lastVideo?.publishedAt
      && Date.parse(channel.lastVideo?.publishedAt) > oneYearAgoDate);

  return (
    <div className="prose max-w-none">
      <div className="container mx-auto pb-20 px-5">
        <h1 className="">
          <Image width="400" height="98" alt="IT Youtubers" src="/ityoutubers-logo.jpg" />
        </h1>
        <p className="w-1/2">
          ITYouTubers — сообщество каналов с IT контентом. Мы собрались, чтобы сделать IT контент лучше и доступнее. Мнения участников наверняка расходятся по многим вопросам, мы стараемся фокусироваться на IT.
        </p>

        <div id="channels" className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          {activeChannels
            .map(({id, snippet, statistics}) => 
              <div key={id} className="grid grid-cols-3 gap-8">
                <div className="col-span-1 not-prose">
                  <a href={`https://youtube.com/channel/${id}`}><Image width={144} height={144} alt="" className="rounded-full" src={snippet.thumbnails.medium.url} /></a> 
                </div>
                <div className="col-span-2">
                  <a href={`https://youtube.com/channel/${id}`}>{snippet.title} • {humanNumber(statistics.subscriberCount)}</a> 
                  <p className="line-clamp-6 text-xs">{snippet.description}</p>
                </div>
              </div>
          )}
        </div>

        <h2>Каналы, которые больше года не выпускают видео</h2>

        <div id="channels" className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {inactiveChannels
            .map(({id, snippet, statistics}) => 
              <div key={id} className="grid grid-cols-3 gap-8">
                <div className="col-span-1 not-prose">
                  <a href={`https://youtube.com/channel/${id}`}><Image width={144} height={144} alt="" className="rounded-full" src={snippet.thumbnails.medium.url} /></a> 
                </div>
                <div className="col-span-2">
                  <a href={`https://youtube.com/channel/${id}`}>{snippet.title} • {humanNumber(statistics.subscriberCount)}</a> 
                  <p className="line-clamp-4 mt-2 text-xs">{snippet.description}</p>
                </div>
              </div>
          )}
        </div>

        <p className="pt-5 mt-20">Сделано с помощью 💩 🪵 🌀 в 2022</p>
      </div>

      <script
        type="text/javascript"
        id="hs-script-loader"
        async
        defer
        src="//js.hs-scripts.com/5930551.js"
      ></script>
    </div>
  )
}
