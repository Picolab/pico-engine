import { apiGet, getAllPicoBoxes } from "../api";

export const fetchSubscriptions = async (boxes) => {
  let subscriptions = [];
  let indexes = [];

  for (let i = 0; i < boxes.length; i++) {
    try {
      subscriptions = subscriptions.concat(await apiGet(`/c/${boxes[i].eci}/query/io.picolabs.subscription/established`));
      while (indexes.length < subscriptions.length) indexes.push(i);
    } catch (e) {
      // do nothing. This code is only run if the pico doesn't have the
      // subscription ruleset installed or if it is not allowed by the policy.
      // In either case we don't add anything to the list of subscriptions
    }
  }

  let map = {};

  for (let i = 0; i < subscriptions.length;i++) {
    if (map[subscriptions[i].Id]) map[subscriptions[i].Id] = [...map[subscriptions[i].Id], boxes[indexes[i]].eci];
    else map[subscriptions[i].Id] = [boxes[indexes[i]].eci];
  }

  return map;
}

export const computeSubscriptionLines = (map, boxes) => {
  let points = [];
  Object.keys(map).map((key) => {
    if (map[key].length > 1) {
      points.push({
        to: {
          x: boxes[map[key][0]].x + boxes[map[key][0]].width / 2,
          y: boxes[map[key][0]].y + boxes[map[key][0]].height / 2
        },
        from: {
          x: boxes[map[key][1]].x + boxes[map[key][1]].width / 2,
          y: boxes[map[key][1]].y + boxes[map[key][1]].height / 2
        }
      });
    }
    else {
      points.push({
        to: {
          x: boxes[map[key][0]].x + boxes[map[key][0]].width / 2,
          y: boxes[map[key][0]].y + boxes[map[key][0]].height / 2
        },
        from: {
          x: 1000,
          y: 0
        }
      });
    }

  });

  return points;
}
