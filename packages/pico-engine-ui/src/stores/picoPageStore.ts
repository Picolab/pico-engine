import * as React from "react";
import { apiGet, getAllPicoBoxes } from "../api";
import { authLogout, UiContext } from "../authApi";
import { PicoBox } from "../types/PicoBox";
import {
  loadOffEnginePosition,
  saveOffEnginePosition,
} from "./offEnginePosition";
import { fetchSubscriptions, computeSubscriptionLines } from "./subscriptions";

type XY = { x: number; y: number };
type LineXYs = { from: XY; to: XY };

export interface OffEngineNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  hosts?: string[];
}

interface State {
  loading: boolean;
  error: string | null;

  uiContext: UiContext | null;
  picoMoving: PicoMoving | null;
  picoBoxes: { [eci: string]: PicoBox };
  channelLines: LineXYs[];
  subLines: LineXYs[];
  offEngineNode: OffEngineNode | null;
  subs: Record<string, { ecis: string[]; sub: Record<string, unknown> }>;
}

export interface PicoMoving {
  eci?: string;
  offEngine?: boolean;
  action: "moving" | "resizing";
  relX: number;
  relY: number;
}

export default (function picoPageStore() {
  let state: State = {
    loading: false,
    error: null,
    uiContext: null,
    picoMoving: null,
    picoBoxes: {},
    subLines: [],
    offEngineNode: null,
    channelLines: [],
    subs: {},
  };

  let offEnginePosition: XY | null = null;
  let rootEciForLayout: string | null = null;

  // way to subscribe and notify react components of state change
  let setters: React.Dispatch<React.SetStateAction<number>>[] = [];
  let clock = 0;
  function notify() {
    clock++;
    setters.forEach(setter => setter(clock));
  }

  function use(): State {
    const [, setter] = React.useState(clock);

    React.useEffect(() => {
      if (!setters.includes(setter)) {
        setters.push(setter);
      }

      return () => {
        setters = setters.filter(s => s !== setter);
      };
    }, []);

    return state;
  }

  async function fetchAll(opts: { retryLateChildren?: boolean } = {}) {
    const quiet = opts.retryLateChildren === true;
    if (!quiet) {
      state.loading = true;
      state.error = null;
      notify();
    }
    try {
      const context: UiContext = await apiGet("/api/ui-context");
      const rootEci = context.eci || context.session?.uiECI;
      if (!rootEci) {
        throw new Error("Not signed in");
      }
      if (rootEciForLayout !== rootEci) {
        rootEciForLayout = rootEci;
        offEnginePosition = loadOffEnginePosition(rootEci);
      }
      const boxes = await getAllPicoBoxes(rootEci);
      state.uiContext = context;
      state.picoBoxes = {};
      for (const box of boxes) {
        state.picoBoxes[box.eci] = box;
      }
      computeChannelLines();
      state.subs = {...await fetchSubscriptions(boxes)};
      computeSubLines();
    } catch (err) {
      if (!quiet) {
        state.error = err + "";
      }
    } finally {
      if (!quiet) {
        state.loading = false;
      }
    }
    notify();
  }

  function fetchAllWithBootstrapRetry() {
    fetchAll();
    for (const ms of [500, 1500, 3000]) {
      window.setTimeout(() => {
        fetchAll({ retryLateChildren: true });
      }, ms);
    }
  }

  function computeSubLines() {
    const result = computeSubscriptionLines(
      state.subs,
      state.picoBoxes,
      offEnginePosition
    );
    state.subLines = result.lines;
    state.offEngineNode = result.offEngineNode;
    if (!offEnginePosition && result.defaultOffEnginePosition) {
      offEnginePosition = result.defaultOffEnginePosition;
    }
  }

  async function refreshSubscriptions() {
    const boxes = Object.values(state.picoBoxes);
    if (boxes.length === 0) {
      return;
    }
    state.subs = { ...(await fetchSubscriptions(boxes)) };
    computeSubLines();
    notify();
  }

  function computeChannelLines() {
    const boxes = Object.values(state.picoBoxes);
    const picoXYs: { [eci: string]: XY } = {};
    for (const box of boxes) {
      picoXYs[box.eci] = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
      };
    }
    state.channelLines = [];
    for (const box of boxes) {
      const from = picoXYs[box.eci];
      for (const eci of box.children) {
        const to = picoXYs[eci];
        if (from && to) {
          state.channelLines.push({ from, to });
        }
      }
    }
  }

  function updateBox(eci: string, updates: Partial<PicoBox>) {
    if (state.picoBoxes.hasOwnProperty(eci)) {
      state.picoBoxes[eci] = {
        ...state.picoBoxes[eci],
        ...updates
      };
      computeChannelLines();
      computeSubLines();
      notify();
    }
  }

  function updateOffEnginePosition(x: number, y: number) {
    offEnginePosition = { x, y };
    computeSubLines();
    notify();
  }

  function persistOffEnginePosition() {
    if (rootEciForLayout && offEnginePosition) {
      saveOffEnginePosition(rootEciForLayout, offEnginePosition);
    }
  }

  function setPicoMoving(p: PicoMoving | null) {
    state.picoMoving = p;
    notify();
  }

  async function logout() {
    await authLogout();
    window.location.reload();
  }

  return {
    use,
    fetchAll,
    fetchAllWithBootstrapRetry,
    refreshSubscriptions,
    updateBox,
    updateOffEnginePosition,
    persistOffEnginePosition,
    setPicoMoving,
    logout,
  };
})();
