const channels = require("../data/channels.json");
const members = require("../data/members.json");
const topics = require("../data/topics.json");

test("there should be channels", () => {
  expect(channels.length).toBeGreaterThan(0);
});

test("there should be members", () => {
  expect(members.length).toBeGreaterThan(0);
});

test("there should be topics", () => {
  expect(topics.length).toBeGreaterThan(0);
});
