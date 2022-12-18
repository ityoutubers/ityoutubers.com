export function orderBySubscribersDesc(a, b) {
  return parseInt(a.statistics.subscriberCount) >
    parseInt(b.statistics.subscriberCount)
    ? -1
    : 1;
}
