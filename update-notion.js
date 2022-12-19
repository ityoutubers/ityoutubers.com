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

async function getMembers() {
  async function query(start_cursor, database_id = process.env.NOTION_DB_UID) {
    return notion.databases.query({
      database_id,
      start_cursor,
    });
  }

  return getPaginatedData(query);
}

(async function update() {
  const idsLens = (item) =>
    item.properties["Channel ID"].rich_text[0]?.plain_text;
  const topisLens = (item) =>
    item.properties["Topic"].relation.map(({ id }) => id);

  let members = await getMembers();

  await Promise.all(
    members.map((m) => {
      return notion.pages.update({
        page_id: m.id,
        properties: {
          Title: {
            title: m.properties["Name"].rich_text,
          },
        },
      });
    })
  );
})();
