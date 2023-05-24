import firebaseAdmin from "firebase-admin";
import fs from "fs";
import { youtube } from "@googleapis/youtube";
import { Client } from "@notionhq/client";
import Parser from "rss-parser";
import _ from "lodash";
import { OpenAIApi, Configuration } from "openai";
import pThrottle from "p-throttle";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const configuration = new Configuration({
  apiKey: process.env.OPEN_API_KEY,
});
const openai = new OpenAIApi(configuration);
function generatePrompt(description) {
  return `Отвечай в формате {ad: string, confidence: int}. Выдели в тексте рекламное сообщение если оно есть и оцени уверенность в том, что это реклама от 0-100. Что не является рекламой: просьба подписаться или поддержать автора. Текст:
  ${description}`;
}
const throttle = pThrottle({
  limit: 1,
  interval: 1500,
});
const throttledOpenAi = throttle(async (messages) =>
  openai
    .createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    })
    .catch(console.error)
);

const serviceAccount = fs.readFileSync(process.env.FIREBASE_CREDENTIALS);
firebaseAdmin.apps.length == 0 &&
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(JSON.parse(serviceAccount)),
    databaseURL: process.env.FIREBASE_URL,
    databaseAuthVariableOverride: {
      uid: process.env.FIREBASE_AUTH_UID,
    },
  });

const firebase = firebaseAdmin.database();

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

async function getChannels() {
  async function query(start_cursor, database_id = process.env.NOTION_DB_UID) {
    return notion().databases.query({
      database_id,
      start_cursor,
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
const courseLens = (item) =>
  item.properties["CourseURL"]
    ? {}
    : {
        url: item.properties["CourseURL"]?.url,
        title: item.properties["CourseTitle"].rich_text[0]?.plain_text,
        description:
          item.properties["CourseDescription"].rich_text[0]?.plain_text,
      };
const fulfilled = ({ status }) => status == "fulfilled";

export async function getYouTubeChannels() {
  let ytChannels = await getChannels();
  const ytChannelsIds = ytChannels.map(idsLens).filter((id) => !!id);

  const meta = ytChannels.reduce(function (acc, cur) {
    acc[idsLens(cur)] = {
      isMember: cur.properties["Active"].checkbox,
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

  let feeds = [];
  for (let id of ytChannelsIds) {
    const feed = await parser.parseURL(channelRSSURL(id)).catch((e) => {
      console.error(id, e);
    });

    feeds.push(feed);
  }

  const descriptions = [];
  const { videos } = _(feeds)
    .filter((feed) => feed.items.length > 0)
    .map((feed) => feed.items[0])
    .reduce(
      (acc, video) => {
        acc.videos[video["yt:channelId"]] = {
          id: video["yt:videoId"],
          channelId: video["yt:channelId"],
          isMember: meta[video["yt:channelId"]].isMember,
          publishedAt: video["pubDate"],
          title: video["title"],
          thumbnail: video["media:group"]["media:thumbnail"][0].$,
          views:
            video["media:group"]["media:community"][0]["media:statistics"][0].$
              .views,
          likes:
            video["media:group"]["media:community"][0]["media:starRating"][0].$
              .count,
          description: video["media:group"]["media:description"]?.join("\n"),
        };

        descriptions.push({
          id: video["yt:videoId"],
          description: video["media:group"]["media:description"]?.join("\n"),
        });

        return acc;
      },
      { videos: {} }
    );

  // const response = await Promise.allSettled(
  //   descriptions.map(({ description }) =>
  //     throttledOpenAi([
  //       {
  //         role: "user",
  //         content: generatePrompt(description),
  //       },
  //     ])
  //   )
  // );

  // console.log(
  //   _.zip(
  //     descriptions,
  //     response.map((res) => res.value?.data.choices[0].message.content)
  //   )
  // );

  youtubeChannels.forEach((ytChannel) => {
    ytChannel["lastVideo"] = videos[ytChannel.id] || {};
    ytChannel["topics"] = meta[ytChannel.id].topics;
    ytChannel["course"] = meta[ytChannel.id].course;
    ytChannel["isMember"] = meta[ytChannel.id].isMember;

    delete ytChannel["etag"];
    delete ytChannel["kind"];
    delete ytChannel["contentDetails"];
    delete ytChannel["snippet"]["localized"];
    delete ytChannel["snippet"]["publishedAt"];
    delete ytChannel["snippet"]["thumbnails"]["default"];
    delete ytChannel["snippet"]["thumbnails"]["high"];
  });

  // store in firebase in background
  await Promise.all([
    firebase.ref(`/videos`).update(
      Object.values(videos).reduce((acc, video) => {
        acc[video.id] = video;
        return acc;
      }, {})
    ),
    firebase.ref(`/channels`).update(
      youtubeChannels.reduce((acc, channel) => {
        acc[channel.id] = channel;
        return acc;
      }, {})
    ),
  ]).catch(console.error);

  return youtubeChannels.sort((a, b) => (a.id > b.id ? 1 : -1));
}
