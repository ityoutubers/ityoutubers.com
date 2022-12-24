const { youtube } = require("@googleapis/youtube");
const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
const youtubeApi = youtube({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY,
});

async function getTopicsQuery(
  start_cursor,
  database_id = process.env.NOTION_TOPICS_DB_UID
) {
  return notion.databases.query({ database_id, start_cursor });
}

async function getPaginatedData(queryFunc) {
  let items = [];

  let page = await queryFunc();
  items = page.results;

  while (page.has_more) {
    page = await queryFunc(page.next_cursor);
    items = items.concat(page.results);
  }

  return items;
}

export async function getMembers(active = true) {
  async function query(start_cursor, database_id = process.env.NOTION_DB_UID) {
    return notion.databases.query({
      database_id,
      start_cursor,
      filter: {
        property: "Active",
        checkbox: {
          equals: active,
        },
      },
    });
  }

  return getPaginatedData(query);
}

export async function getTopics() {
  const topics = (await getPaginatedData(getTopicsQuery)).map((topic) => ({
    id: topic.id,
    name: topic.properties.Name.title[0]?.plain_text,
  }));

  return topics;
}

export async function getYouTubeChannels(channelsPromise) {
  let youtubeChannels = [];

  const idsLens = (item) =>
    item.properties["Channel ID"].rich_text[0]?.plain_text;
  const topisLens = (item) =>
    item.properties["Topic"].relation.map(({ id }) => id);

  let members = await channelsPromise;
  const ytChannelsIds = members.map(idsLens).filter((id) => !!id);

  const topics = members.reduce(function (acc, cur) {
    acc[idsLens(cur)] = topisLens(cur);
    return acc;
  }, {});

  while (ytChannelsIds.length > 0) {
    const res = await youtubeApi.channels.list({
      id: ytChannelsIds.splice(0, 50).join(","),
      part: "id,snippet,statistics,contentDetails",
      maxResults: 50,
    });
    youtubeChannels = youtubeChannels.concat(res.data.items);
  }

  const playlistIds = youtubeChannels.map(
    (ytChannel) => ytChannel.contentDetails.relatedPlaylists.uploads
  );

  const videos = {};
  await Promise.all(
    playlistIds.map((id) =>
      youtubeApi.playlistItems
        .list({
          part: "id, snippet, contentDetails",
          playlistId: id,
          maxResults: 1,
        })
        .catch((res) => ({}))
    )
  ).then((all) =>
    all.forEach((res) => {
      const video = res.data?.items[0];

      if (video) {
        videos[video.snippet.videoOwnerChannelId] = {
          id: video.contentDetails.videoId,
          publishedAt: video.snippet.publishedAt,
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.high,
        };
      }
    })
  );

  youtubeChannels.forEach((ytChannel) => {
    ytChannel["lastVideo"] = videos[ytChannel.id];
    ytChannel["topics"] = topics[ytChannel.id];

    delete ytChannel["etag"];
    delete ytChannel["kind"];
    delete ytChannel["contentDetails"];
    delete ytChannel["snippet"]["localized"];
    delete ytChannel["snippet"]["publishedAt"];
    delete ytChannel["snippet"]["thumbnails"]["default"];
    delete ytChannel["snippet"]["thumbnails"]["high"];
  });

  return youtubeChannels.sort((a, b) => (a.id > b.id ? 1 : -1));
}
