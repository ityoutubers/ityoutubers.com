export function orderBySubscribersDesc(a, b) {
  return parseInt(a.statistics.subscriberCount) >
    parseInt(b.statistics.subscriberCount)
    ? -1
    : 1;
}

export function orderByVideoDateDesc(a, b) {
  return parseInt(Date.parse(a.lastVideo.publishedAt)) >
    parseInt(Date.parse(b.lastVideo.publishedAt))
    ? -1
    : 1;
}
