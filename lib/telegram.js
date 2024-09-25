import { fileURLToPath } from "url";
import ora from "ora";
import entities from "entities";

import { Telegraf } from "telegraf";
import { TwitterApi } from "twitter-api-v2";
import { MongoClient } from "mongodb";
import RSSHub from "rsshub";

import _ from "lodash";
import { OpenAI } from "openai";

import * as dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

async function retry(promise, retries = 5) {
  try {
    return await promise;
  } catch (e) {
    if (retries > 0) {
      return retry(promise, retries - 1);
    } else {
      return Promise.reject(e);
    }
  }
}

function stripHtml(str) {
  str = str.replace(
    /([^\n])<\/?(h|br|p|ul|ol|li|blockquote|section|table|tr|div)(?:.|\n)*?>([^\n])/gm,
    "$1\n$3"
  );
  str = str.replace(/<(?:.|\n)*?>/gm, "");
  return str;
}
function createSnippet(str) {
  return entities.decodeHTML(stripHtml(str)).trim();
}

const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });
const mongo = new MongoClient(process.env.MONGODB_URI);
RSSHub.init({
  CACHE_TYPE: null,
});

export async function updateTelegramPosts() {
  let channels = [
    "ait_bro01z",
    "alazitskaya",
    "Alek_OS",
    "alx_four",
    "Analyze_this_WITH_ME",
    "aocore",
    "archakovblog",
    "ArtemDimitrov",
    "azatblog",
    "balabol_it",
    "Catcher_IT",
    "coding_interviews",
    "datamisha",
    "decembristit",
    "deferpanic",
    "dev_yttg",
    "digital_ninjaa",
    "ershovds",
    "excalib_channel",
    "extremecode",
    "friendlyFrontend",
    "GamedevForge",
    "gmoreva",
    "golang_digest",
    "it_diva_offical",
    "itdevgirl",
    "ivandoronin1",
    "kotelov_digital_finance",
    "kotelov_love",
    "LearnMore_tech",
    "leshamarshal",
    "megdu_skobok",
    "mflenov",
    "myobrechenychannel",
    "noukashblog",
    "ntuzov",
    "onigiriScience",
    "programmers_ed",
    "prorobotovchannel",
    "pylounge",
    "pymagic",
    "qachanell",
    "rzrbs",
    "seniorsoftwarevlogger",
    "softwareengineervlog",
    "svyatamesto",
    "teamleadtalks_com",
    "tpverstak",
    "VChunt",
    "vitaly_kuliev_it",
    "vm_faang",
    "VyacheArt",
    "webelart",
    "worlditech",
    "xuyanet",
    "zhukovsd_it_mentor",
    "zufarexplained",
    // "fallenprod",
    // "itpadcast",
    // "johenews",
    // "nopaper_ru",
  ];

  const channelRSSURL = (channelName) => `/telegram/channel/${channelName}`;

  let feeds = [];
  for (let channelName of channels) {
    const spinner = ora(`Parsing ${channelName}`).start();
    await RSSHub.request(channelRSSURL(channelName))
      // .then((feed) => {
      //   console.log(feed);
      //   return feed;
      // })
      .then((feed) =>
        feeds.push(
          feed.item.map(({ title, link, pubDate, description }) => ({
            title,
            link,
            content: createSnippet(description),
            date: new Date(pubDate),
            channelName,
          }))
        )
      )
      .then(() => spinner.succeed(`Parsed ${channelName}`))
      .catch((e) => spinner.fail(e.message));
  }

  await mongo.connect();

  console.log(`- Found ${feeds.flat().length} posts`);

  // filter posts older than 5 days
  const fiveDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5);
  const posts = feeds.flat().filter(({ date }) => date > fiveDaysAgo);

  console.log(`- Found ${posts.length} posts`);

  if (posts.length === 0) return [];

  const collection = mongo.db("ityoutubers").collection("telegram");
  try {
    return await Promise.all(
      posts.map((f) =>
        collection.updateOne({ link: f.link }, { $set: f }, { upsert: true })
      )
    )
      .then((records) =>
        sendTwitterNotification(posts, records).catch(console.error)
      )
      .catch(console.error);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function aiAugment(post) {
  const MAX_CHARS = 6400; // roughly 32000 tokens
  const spinner = ora(`Augmenting ${post.link}`).start();

  return openai.chat.completions
    .create({
      model: "gpt-4o", // gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: `Ты редактор новостного издания. Тебе нужно составить список статей для главной страницы`,
        },
        {
          role: "user",
          content: `Отвечай в формате json {title: string, summary: sting, tags: array, ad: int} не используй никакие обертки ответ должен начинаться с { и заканчиваться }. Придумай заголовок. Напиши кратко суть статьи в двух строках. Оцени вероятность того, что это рекламная статья в процентах. Предложи максимум 2 тега для статьи.
Статья:
${post.content.substring(0, MAX_CHARS)}`,
        },
      ],
    })
    .then((res) => {
      spinner.succeed(`Augmented ${post.link}`);

      let content = res.choices[0].message.content;
      content = content.replace(/```json\n/, "").replace(/\n```/g, "");

      let meta = JSON.parse(content || "{}");
      meta = Array.isArray(meta) ? meta[0] : meta;
      return { ...post, meta };
    })
    .catch((e) => {
      spinner.fail(`Augmentation failed for ${post.link}: ${e.message}`);
      throw e;
    });
}

function sendTwitterNotification(posts, records) {
  const MIN_POST_LENGTH = 500;
  const startDate = Date.now() - 24 * 60 * 60 * 1000;

  const lastDayFilter = (post) => post.date > startDate;
  const adsFilter = (post) => !post.content?.match(/(интеграция|реклам|#ad)/i);
  const shortPostsFilter = (post) => post.content?.length > MIN_POST_LENGTH;
  const forwardedFilter = (post) => !post.content?.startsWith("Forwarded From");

  const twitterClient = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  });

  const twitterSpinner = ora("Refreshing Twitter token").start();
  return mongo
    .db("ityoutubers")
    .collection("config")
    .findOne({ TWITTER_REFRESH_TOKEN: { $exists: true } })
    .then((config) =>
      twitterClient
        .refreshOAuth2Token(config.TWITTER_REFRESH_TOKEN)
        .then(({ client, refreshToken }) => {
          twitterSpinner.succeed(`Twitter token refreshed: ${refreshToken}`);

          return mongo
            .db("ityoutubers")
            .collection("config")
            .updateOne(
              { TWITTER_REFRESH_TOKEN: { $exists: true } },
              { $set: { TWITTER_REFRESH_TOKEN: refreshToken } }
            )
            .then(() => ({ client, refreshToken }));
        })
        .then(({ client, refreshToken }) => {
          const notifications = _(posts)
            .zipWith(records) // so we can get the upsertedId
            .filter(([_, { upsertedId }]) => upsertedId) // take only new posts
            .tap((newPosts) => console.log(`- ${newPosts.length} new posts`))
            .map(0) // take only the posts
            .filter(lastDayFilter)
            .filter(adsFilter)
            .filter(shortPostsFilter)
            .filter(forwardedFilter)
            .tap((filteredPosts) =>
              console.log(`- ${filteredPosts.length} filtered posts`)
            )
            .map((post) => retry(aiAugment(post), 3))
            .map((augmentedPost) =>
              augmentedPost
                .then((post) =>
                  mongo
                    .db("ityoutubers")
                    .collection("telegram")
                    .updateOne({ link: post.link }, { $set: post })
                    .then(() => post)
                )
                .then(({ link, meta }) => {
                  const fullTwitt = `${meta.title}\n\n${meta.summary}\n\n${link}`;
                  const MAX_LENGTH = 280;
                  const tweetSpinner = ora(`Sending tweet for ${link}`).start();

                  return client.v2
                    .tweet(
                      fullTwitt.length > MAX_LENGTH
                        ? `${meta.title}\n\n${link}`
                        : fullTwitt
                    )
                    .then((res) =>
                      tweetSpinner.succeed(
                        `Tweet sent: https://twitter.com/ityoutubers/status/${res.data.id}`
                      )
                    )
                    .catch((e) => {
                      tweetSpinner.fail(`Tweet failed: ${e.message}`);
                    });
                })
            )
            .value();

          return Promise.all(notifications);
        })
        .catch((e) => {
          twitterSpinner.fail(`Twitter token refresh failed:`);
          console.error(JSON.stringify(e, null, 2));
        })
    );
}

function formatDateInRussian(date) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return date.toLocaleString("ru-RU", options);
}

function getDigestTitle() {
  return `Дайджест постов ${formatDateInRussian(new Date())}`;
}

function getDigest(posts) {
  return `${posts
    .map(
      (post) =>
        `<a href="${post.link}">${post.meta.title}</a>\n${
          post.meta.summary
        }\n${post.meta.tags
          ?.map((tag) => `#${tag.replace(/\s|-/g, "_")}`)
          .join(" ")
          .toLowerCase()}`
    )
    .join(
      "\n\n"
    )}\n\nБольше: <a href='https://ityoutubers.com/all-channels'>Видео</a> | <a href='https://t.me/ityoutubers_com/63'>Папка с телегами</a> | <a href='https://twitter.com/ityoutubers'>Twitter</a>
`;
}

function sendTelegramDigest() {
  const telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // fetch posts from the last 30 hours to have an overlap
  const startDate = new Date(Date.now() - 30 * 60 * 60 * 1000);

  const telegramSpinner = ora(
    `Sending Telegram digest since ${startDate}`
  ).start();

  return mongo
    .db("ityoutubers")
    .collection("telegram")
    .find(
      {
        date: { $gt: startDate },
        digested: { $exists: false },
        meta: { $exists: true },
      },
      { sort: { date: -1 } }
    )
    .toArray()
    .then((posts) => {
      if (!posts.length) {
        telegramSpinner.succeed(`No posts to send`);
        return [];
      }

      telegramSpinner.text = `Sending ${posts.length} posts`;

      const postsPages = _(posts).chunk(10).value();

      return Promise.all(
        postsPages.map((postsPage, i) =>
          telegraf.telegram.sendMessage(
            process.env.TELEGRAM_CHANNEL_ID,
            i === 0
              ? getDigestTitle() + "\n\n" + getDigest(postsPage)
              : getDigest(postsPage),
            {
              parse_mode: "HTML",
              disable_web_page_preview: true,
            }
          )
        )
      ).then(() => posts);
    })
    .then((posts) => {
      // update posts, set digested  to true
      const ids = posts.map((post) => post._id);
      return mongo
        .db("ityoutubers")
        .collection("telegram")
        .updateMany({ _id: { $in: ids } }, { $set: { digested: true } });
    })
    .then(() => telegramSpinner.succeed(`Telegram digest sent`))
    .catch(console.error);
}

// To run this module directly from the command line
const currentModulePath = fileURLToPath(import.meta.url);
const mainModulePath = process.argv[1];

if (currentModulePath === mainModulePath) {
  switch (process.argv[2]) {
    case "update":
      await updateTelegramPosts().then(() => {
        mongo.close();
        process.exit(0);
      });
      break;
    case "digest":
      await sendTelegramDigest().then(() => {
        mongo.close();
        process.exit(0);
      });
      break;

    default:
      console.log("Usage: node telegram.js [update|digest]");
      process.exit(1);
  }
}
