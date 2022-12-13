require("dotenv").config({path: "./.env.local"});

const { youtube } = require("@googleapis/youtube");
const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
const youtubeApi = youtube({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY,
});

async function getActiveChannels(start_cursor, database_id = process.env.NOTION_DB_UID) {
  return notion.databases.query({
    database_id,
    start_cursor,
    filter: {
      property: "Active",
      checkbox: {
        equals: true,
      },
    },
  })
}

async function getChannelsIds() {
  const getIds = item => item.properties['Channel ID'].rich_text[0]?.plain_text;

  let ids = [];

  let page = await getActiveChannels();
  ids = ids.concat(page.results.map(getIds));

  while(page.has_more) {
    page = await getActiveChannels(page.next_cursor);
    ids = ids.concat(page.results.map(getIds));
  }

  return ids.filter(item => !!item);
}

async function main(params) {
  let items = [];

  let ids = await getChannelsIds();

  while (ids.length > 0) {
    const res = await youtubeApi.channels.list({
      id: ids.splice(0, 10).join(","),
      part: "id,snippet,statistics,contentDetails",
      maxResults: 50,
    });
    items = items.concat(res.data.items);
  }

  const playlistIds = items.map(item => item.contentDetails.relatedPlaylists.uploads);

  const videos = {};
  await Promise.all(
    playlistIds.map(id => youtubeApi.playlistItems.list({
          part: "id, snippet", 
          playlistId: id, 
          maxResults: 1
        }).catch(res => ({}))
    )).then(all => all.forEach(res => (
      videos[res.data?.items[0]?.snippet?.videoOwnerChannelId] = {
        publishedAt: res.data?.items[0]?.snippet?.publishedAt,
        title: res.data?.items[0]?.snippet?.title,
      })
    ));

  // TODO: delete extra fields
  items.forEach(item => (
    item['lastVideo'] = videos[item.id]
  ));

  console.log(JSON.stringify(items));
}

main().catch(console.error);
