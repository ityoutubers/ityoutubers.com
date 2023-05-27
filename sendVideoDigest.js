import { MongoClient } from "mongodb";
import fs from "fs/promises";
import fsSync from "fs";
import https from "https";
import { Telegraf } from "telegraf";
import _ from "lodash";

import * as dotenv from "dotenv";

import generateSlides from "./lib/slideshow.js";

dotenv.config({ path: "./.env.local", override: false });

const mongo = new MongoClient(process.env.MONGODB_URI);
await mongo.connect();

async function fetchVideosForDate(date) {
  const oneDayAgo = date - 24 * 60 * 60000;
  return mongo
    .db("ityoutubers")
    .collection("videos")
    .find({ isMember: true, publishedAt: { $gte: new Date(oneDayAgo) } })
    .toArray();

  return firebase
    .ref(`videos`)
    .orderByChild("publishedAt")
    .limitToLast(100)
    .once("value")
    .then((snapshot) => {
      // Filter Videos by the publishedAt for the last 24 hours
      const oneDayAgo = date - 24 * 60 * 60000;
      const videos = Object.values(snapshot.val()).filter((video) => {
        return Date.parse(video.publishedAt) > oneDayAgo && video.isMember;
      });

      return videos;
    });
}

const downloadFile = async (url, localFilePath) =>
  new Promise((resolve, reject) => {
    const file = fsSync.createWriteStream(localFilePath);

    https
      .get(url, (response) => {
        response.pipe(file);

        file.on("finish", () => {
          file.close(() => {
            console.log(`Downloaded and saved the file to ${localFilePath}`);
            resolve(localFilePath);
          });
        });
      })
      .on("error", (error) => {
        fs.unlink(localFilePath, () => {
          console.error(`Error downloading the file: ${error.message}`);
          reject(error);
        });
      });
  });

await fetchVideosForDate(Date.now())
  .then((videos) =>
    Promise.all(
      videos.map((video) =>
        downloadFile(video.thumbnail.url, `./images/${video.id}.jpg`)
      )
    ).then((images) => [videos, images])
  )
  .then(([videos, images]) =>
    generateSlides(images, `./videos/${Date.now()}.mp4`).then((videoPath) => [
      videos,
      videoPath,
    ])
  )
  .then(([videos, videoPath]) => {
    // Using telegrafjs upload video to telegram and createa a post with the list of videos
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    const videoStream = fsSync.createReadStream(videoPath);

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const date = new Date().toLocaleString("ru-RU", options);
    const videosList = videos
      .map(
        (video, i) =>
          `${i + 1}. <a href="https://youtube.com/watch?v=${video.id}">${
            video.title.length > 50
              ? video.title.substring(0, 50) + "..."
              : video.title
          }</a>`
      )
      .join("\n");

    return bot.telegram.sendVideo(
      process.env.TELEGRAM_CHANNEL_ID,
      { source: videoStream },
      {
        // Caption is limited to 1024 characters
        caption: `<b>Видео дайджест за ${date}</b>\n\n${videosList}\n\n@ityoutubers_com`,
        parse_mode: "HTML",
      }
    );
    // .catch((e) => {
    //   if (e.response?.error_code === 400) {
    //     return Promise.all([
    //       bot.telegram.sendVideo(process.env.TELEGRAM_CHANNEL_ID, {
    //         source: videoStream,
    //       }),
    //       bot.telegram.sendMessage(
    //         process.env.TELEGRAM_CHANNEL_ID,
    //         `<b>Видео дайджест за ${date}</b>\n\n${videosList}\n\n@ityoutubers_com`,
    //         { parse_mode: "HTML" }
    //       ),
    //     ]);
    //   }
    // });
  })
  .then(() => {
    // Delete all the images and video
    return Promise.all([
      fs
        .readdir("./images")
        .then((files) =>
          Promise.all(
            files.map((file) => fs.unlink(`./images/${file}`).catch())
          )
        )
        .catch(),
      fs
        .readdir("./videos")
        .then((files) =>
          Promise.all(
            files.map((file) => fs.unlink(`./videos/${file}`).catch())
          )
        )
        .catch(),
    ]);
  })
  .then(() => process.exit(0))
  .catch(console.error);
