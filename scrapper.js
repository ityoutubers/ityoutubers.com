require("dotenv").config();

const { youtube } = require("@googleapis/youtube");
const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
const youtubeApi = youtube({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY,
});

async function getChannelIds() {
  return await notion.databases.query({
    database_id: process.env.NOTION_DB_UID,
    filter: {
      property: "Active",
      checkbox: {
        equals: true,
      },
    },
  }).then(result => result.results.map(item => item.properties['Channel ID'].rich_text[0]?.plain_text));
}

// getChannelIds().then(data => console.log(data));

const params = {
  part: "id,snippet,statistics",
  maxResults: 50,
};

async function main(params) {
  let items = [];

  while (ids.length > 0) {
    const res = await youtubeApi.channels.list({
      id: ids.splice(0, 10).join(","),
      ...params,
    });
    items = items.concat(res.data.items);
  }

  console.log(JSON.stringify(items));
}

main(params).catch(console.error);
