import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import pathToFfmpeg from "ffmpeg-static";
import { fileURLToPath } from "url";

// Set up slideshow parameters
const durationPerImage = 2; // Duration of each image in seconds
const videoWidth = 1280; // Width of the output video
const videoHeight = 720; // Height of the output video
const outputFormat = "mp4"; // Output video format, e.g., 'mp4', 'webm', 'avi'

Ffmpeg.setFfmpegPath(pathToFfmpeg);

export default function generateSlides(imagePaths, outputVideo) {
  // Configure FFmpeg
  const command = ffmpeg();

  imagePaths.forEach((imagePath) => {
    command
      .input(imagePath)
      .inputOptions([`-loop 1`, `-t ${durationPerImage}`]);
  });

  return new Promise((resolve, reject) => {
    command
      .complexFilter(
        createFilterComplexScript(imagePaths.length, videoWidth, videoHeight)
      )
      .output(outputVideo)
      .outputOptions([
        `-map [out]`,
        `-s:v ${videoWidth}x${videoHeight}`,
        `-f ${outputFormat}`,
      ])
      .on("start", (commandLine) =>
        console.log("Starting video generation", commandLine)
      )
      .on("progress", (progress) =>
        console.log("Processing:", progress.percent + "%")
      )
      .on("error", (err) => {
        console.error("Error:", err);
        reject(err);
      })
      .on("end", () => {
        console.log("Video generation complete");
        resolve(outputVideo);
      })
      .run();
  });
}

function createFilterComplexScript(imageCount, videoWidth, videoHeight) {
  let script = [];
  let inputs = [];
  let outputs = [];

  const textY = videoHeight - 137;

  for (let i = 0; i < imageCount; i++) {
    let textX = i > 9 ? 30 : 60;

    inputs.push(`[${i}:v]`);
    outputs.push(`[out${i}]`);

    script.push(
      `${
        inputs[i]
      }scale=w=${videoWidth}:h=${videoHeight}:force_original_aspect_ratio=increase,crop=${videoWidth}:${videoHeight},drawbox=x=20:y=${
        videoHeight - 170
      }:w=150:h=150:color=black@0.5:t=fill,drawtext=text='${
        i + 1
      }':x=${textX}:y=${textY}:fontsize=100:fontcolor=white${outputs[i]}`
    );
  }

  script.push(`${outputs.join("")}concat=n=${imageCount}:v=1:a=0[out]`);

  return script.join(";");
}

// To run this module directly from the command line
const currentModulePath = fileURLToPath(import.meta.url);
const mainModulePath = process.argv[1];

if (currentModulePath === mainModulePath) {
  const imagesFolder = process.argv[2];
  const outputVideo = process.argv[3];

  // Get image paths
  const imagePaths = fs
    .readdirSync(imagesFolder)
    .filter((file) => file.match(/\.(png|jpe?g)$/i))
    .map((file) => path.join(imagesFolder, file));

  await generateSlides(imagePaths, outputVideo);
}
