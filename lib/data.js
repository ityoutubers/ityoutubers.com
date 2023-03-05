import { youtube } from "@googleapis/youtube";
import { Client } from "@notionhq/client";
import Parser from "rss-parser";
import _ from "lodash";

const notion = () =>
  new Client({
    auth: process.env.NOTION_API_KEY,
  });
const youtubeApi = () =>
  youtube({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY,
  });
const parser = new Parser({
  customFields: { item: ["yt:videoId", "yt:channelId", "media:group"] },
});

async function getTopicsQuery(
  start_cursor,
  database_id = process.env.NOTION_TOPICS_DB_UID
) {
  return notion().databases.query({ database_id, start_cursor });
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
    return notion().databases.query({
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
const fulfilled = ({ status }) => status == "fulfilled";

export async function getYouTubeChannels(ytChannelsPromise) {
  let ytChannels = await ytChannelsPromise;
  const ytChannelsIds = ytChannels.map(idsLens).filter((id) => !!id);

  const meta = ytChannels.reduce(function (acc, cur) {
    acc[idsLens(cur)] = {
      topics: topisLens(cur),
      course: courseLens(cur),
    };
    return acc;
  }, {});

  const maxResults = 50;
  const settledChannels = await Promise.allSettled(
    _.chunk(ytChannelsIds, maxResults).map((chunk) =>
      youtubeApi().channels.list({
        id: chunk.join(","),
        part: "id,snippet,statistics,contentDetails",
        maxResults,
      })
    )
  );
  const [channels] = _.partition(settledChannels, fulfilled);
  const youtubeChannels = channels.flatMap(({ value }) => value.data.items);

  const channelRSSURL = (id) =>
    `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
  const settledFeeds = await Promise.allSettled(
    ytChannelsIds.map((id) => parser.parseURL(channelRSSURL(id)))
  );

  const [feeds, feedsErrors] = _.partition(settledFeeds, fulfilled);

  feedsErrors.forEach(({ reason }) => console.error(reason));

  const videos = _(feeds)
    .filter(({ value }) => value.items.length > 0)
    .map(({ value }) => value.items[0])
    .reduce((acc, video) => {
      acc[video["yt:channelId"]] = {
        id: video["yt:videoId"],
        publishedAt: video["pubDate"],
        title: video["title"],
        thumbnail: video["media:group"]["media:thumbnail"][0].$,
      };

      return acc;
    }, {});

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
