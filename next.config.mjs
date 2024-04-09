/** @type {import('next').NextConfig} */

// import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  output: "standalone",
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  reactStrictMode: true,
  // sentry: {
  //   hideSourceMaps: true,
  // },
  appDir: true,
  images: {
    unoptimized: false,
    domains: ["yt3.ggpht.com", "*.ytimg.com"],
  },
  async redirects() {
    return [
      {
        source: "/other-channels",
        destination: "/all-channels",
        permanent: true,
      },
    ];
  },
};

// const sentryWebpackPluginOptions = {
//   // Additional config options for the Sentry Webpack plugin. Keep in mind that
//   // the following options are set automatically, and overriding them is not
//   // recommended:
//   //   release, url, org, project, authToken, configFile, stripPrefix,
//   //   urlPrefix, include, ignore

//   silent: true, // Suppresses all logs
//   // For all available options, see:
//   // https://github.com/getsentry/sentry-webpack-plugin#options.
// };

export default nextConfig;
