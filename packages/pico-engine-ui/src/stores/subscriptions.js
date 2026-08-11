import { apiGet } from "../api";

/**
 * @typedef {Object} SubGraphEntry
 * @property {string[]} ecis Local picos that hold this subscription Id
 * @property {Record<string, unknown>} sub Established bus record (first seen)
 */

/**
 * @param {Array<{ eci: string }>} boxes
 * @returns {Promise<Record<string, SubGraphEntry>>}
 */
export const fetchSubscriptions = async (boxes) => {
  let subscriptions = [];
  let indexes = [];

  for (let i = 0; i < boxes.length; i++) {
    try {
      subscriptions = subscriptions.concat(
        await apiGet(
          `/c/${boxes[i].eci}/query/io.picolabs.subscription/established`
        )
      );
      while (indexes.length < subscriptions.length) indexes.push(i);
    } catch (e) {
      // subscription ruleset missing or policy denied
    }
  }

  /** @type {Record<string, SubGraphEntry>} */
  const map = {};

  for (let i = 0; i < subscriptions.length; i++) {
    const sub = subscriptions[i];
    const eci = boxes[indexes[i]].eci;
    if (map[sub.Id]) {
      map[sub.Id].ecis.push(eci);
    } else {
      map[sub.Id] = { ecis: [eci], sub };
    }
  }

  return map;
};

const OFF_ENGINE_NODE_W = 128;
const OFF_ENGINE_NODE_H = 44;

/**
 * @param {Record<string, SubGraphEntry>} subMap
 * @param {Record<string, { x: number; y: number; width: number; height: number }>} boxes
 * @param {{ x: number; y: number } | null | undefined} savedPosition
 */
export const computeSubscriptionLines = (subMap, boxes, savedPosition) => {
  /** @type {Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>} */
  const lines = [];

  /** @type {Array<{ box: { x: number; y: number; width: number; height: number }; center: { x: number; y: number } }>} */
  const offEngineConnections = [];
  /** @type {Set<string>} */
  const hosts = new Set();

  Object.keys(subMap).forEach((key) => {
    const { ecis } = subMap[key];
    if (ecis.length > 1) {
      const boxA = boxes[ecis[0]];
      const boxB = boxes[ecis[1]];
      if (boxA && boxB) {
        lines.push({
          to: {
            x: boxA.x + boxA.width / 2,
            y: boxA.y + boxA.height / 2,
          },
          from: {
            x: boxB.x + boxB.width / 2,
            y: boxB.y + boxB.height / 2,
          },
        });
      }
      return;
    }

    const box = boxes[ecis[0]];
    if (!box) {
      return;
    }

    const sub = subMap[key].sub || {};
    if (typeof sub.Tx_host === "string" && sub.Tx_host.length > 0) {
      hosts.add(sub.Tx_host);
    }

    offEngineConnections.push({
      box,
      center: {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      },
    });
  });

  if (offEngineConnections.length === 0) {
    return { lines, offEngineNode: null, defaultOffEnginePosition: null };
  }

  const maxRight = Math.max(
    ...offEngineConnections.map(({ box }) => box.x + box.width)
  );
  const avgCenterY =
    offEngineConnections.reduce((sum, { center }) => sum + center.y, 0) /
    offEngineConnections.length;

  const defaultOffEnginePosition = {
    x: maxRight + 160 - OFF_ENGINE_NODE_W / 2,
    y: avgCenterY - OFF_ENGINE_NODE_H / 2,
  };

  const position = savedPosition || defaultOffEnginePosition;
  const nodeCenter = {
    x: position.x + OFF_ENGINE_NODE_W / 2,
    y: position.y + OFF_ENGINE_NODE_H / 2,
  };

  for (const { center } of offEngineConnections) {
    lines.push({
      from: nodeCenter,
      to: center,
    });
  }

  return {
    lines,
    offEngineNode: {
      id: "off-engine",
      x: position.x,
      y: position.y,
      width: OFF_ENGINE_NODE_W,
      height: OFF_ENGINE_NODE_H,
      label: "Off Engine",
      hosts: Array.from(hosts),
    },
    defaultOffEnginePosition,
  };
};
