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

const idsLens = (item) =>
  item.properties["Channel ID"].rich_text[0]?.plain_text;
const topisLens = (item) =>
  item.properties["Topic"].relation.map(({ id }) => id);
const courseLens = (item) => ({
  url: item.properties["CourseURL"]?.url,
  title: item.properties["CourseTitle"].rich_text[0]?.plain_text,
  description: item.properties["CourseDescription"].rich_text[0]?.plain_text,
});

export async function getYouTubeChannels(channelsPromise) {
  let youtubeChannels = [];

  let members = await channelsPromise;
  const ytChannelsIds = members.map(idsLens).filter((id) => !!id);

  const meta = members.reduce(function (acc, cur) {
    acc[idsLens(cur)] = {
      topics: topisLens(cur),
      course: courseLens(cur),
    };
    return acc;
  }, {});

  const maxResults = 50;
  while (ytChannelsIds.length > 0) {
    const res = await youtubeApi.channels.list({
      id: ytChannelsIds.splice(0, maxResults).join(","),
      part: "id,snippet,statistics,contentDetails",
      maxResults,
    });
    youtubeChannels = youtubeChannels.concat(res.data.items);
  }

  const playlistIds = youtubeChannels.map(
    (ytChannel) => ytChannel.contentDetails.relatedPlaylists.uploads
  );

  const playlists = await Promise.all(
    playlistIds.map((id) =>
      youtubeApi.playlistItems
        .list({
          part: "id, snippet, contentDetails",
          playlistId: id,
          maxResults: 1,
        })
        .catch((res) => ({}))
    )
  );

  const videos = {};
  playlists.forEach((res) => {
    const video = res.data?.items[0];

    if (video) {
      videos[video.snippet.videoOwnerChannelId] = {
        id: video.contentDetails.videoId,
        publishedAt: video.snippet.publishedAt,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high,
      };
    }
  });

  youtubeChannels.forEach((ytChannel) => {
    ytChannel["lastVideo"] = videos[ytChannel.id];
    ytChannel["topics"] = meta[ytChannel.id].topics;
    ytChannel["course"] = meta[ytChannel.id].course;

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
