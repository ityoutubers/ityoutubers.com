require("dotenv").config({ path: "./.env.local" });

const { youtube } = require("@googleapis/youtube");
const { Client } = require("@notionhq/client");
const fs = require("fs/promises");

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

async function getActiveMembersQuery(
  start_cursor,
  database_id = process.env.NOTION_DB_UID
) {
  return notion.databases.query({
    database_id,
    start_cursor,
    filter: {
      property: "Active",
      checkbox: {
        equals: true,
      },
    },
  });
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

async function getActiveMembers() {
  return await getPaginatedData(getActiveMembersQuery);
}

async function getTopics() {
  const topics = (await getPaginatedData(getTopicsQuery)).map((topic) => ({
    id: topic.id,
    name: topic.properties.Name.title[0]?.plain_text,
  }));

  return topics;
}

async function getYouTubeChannels() {
  let youtubeChannels = [];

  const idsLens = (item) =>
    item.properties["Channel ID"].rich_text[0]?.plain_text;
  const topisLens = (item) =>
    item.properties["Topic"].relation.map(({ id }) => id);

  let members = await getActiveMembers();
  const ytChannelsIds = members.map(idsLens).filter((id) => !!id);

  const topics = members.reduce(function (acc, cur) {
    acc[idsLens(cur)] = topisLens(cur);
    return acc;
  }, {});

  while (ytChannelsIds.length > 0) {
    const res = await youtubeApi.channels.list({
      id: ytChannelsIds.splice(0, 10).join(","),
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
          part: "id, snippet",
          playlistId: id,
          maxResults: 1,
        })
        .catch((res) => ({}))
    )
  ).then((all) =>
    all.forEach(
      (res) =>
        (videos[res.data?.items[0]?.snippet?.videoOwnerChannelId] = {
          publishedAt: res.data?.items[0]?.snippet?.publishedAt,
          title: res.data?.items[0]?.snippet?.title,
        })
    )
  );

  // TODO: delete extra fields
  youtubeChannels.forEach((ytChannel) => {
    ytChannel["lastVideo"] = videos[ytChannel.id];
    ytChannel["topics"] = topics[ytChannel.id];
  });

  return youtubeChannels;
}

Promise.all([
  getTopics().then((data) =>
    fs.writeFile("./pages/api/topics.json", JSON.stringify(data))
  ),
  getYouTubeChannels().then((data) =>
    fs.writeFile("./pages/api/channels.json", JSON.stringify(data))
  ),
]).catch(console.error);
