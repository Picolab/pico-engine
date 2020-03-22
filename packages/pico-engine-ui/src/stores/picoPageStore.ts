import * as React from "react";
import { apiGet } from "../api";

interface UiContext {
  version: string;
  eci: string;
}

export interface PicoMoving {
  eci: string;
  action: "moving" | "resizing";
  relX: number;
  relY: number;
}

export interface PicoBox {
  eci: string;
  parent: string | null;
  children: string[];

  name: string;
  backgroundColor: string;

  x: number;
  y: number;
  width: number;
  height: number;
}

async function getAllPicoBoxes(eci: string): Promise<PicoBox[]> {
  let results: PicoBox[] = [];

  const pico = await apiGet(`/c/${eci}/query/io.picolabs.next/box`);
  results.push(pico);

  for (const eci of pico.children) {
    results = results.concat(await getAllPicoBoxes(eci));
  }

  return results;
}

type XY = { x: number; y: number };
type LineXYs = { from: XY; to: XY };

interface State {
  loading: boolean;
  error: string | null;

  uiContext: UiContext | null;
  picoMoving: PicoMoving | null;
  picoBoxes: { [eci: string]: PicoBox };
  channelLines: LineXYs[];
}

export default (function picoPageStore() {
  let state: State = {
    loading: false,
    error: null,
    uiContext: null,
    picoMoving: null,
    picoBoxes: {},
    channelLines: []
  };

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

  async function fetchAll() {
    state.loading = true;
    state.error = null;
    notify();
    try {
      const context: UiContext = await apiGet("/api/ui-context");
      const boxes = await getAllPicoBoxes(context.eci);
      state.uiContext = context;
      state.picoBoxes = {};
      for (const box of boxes) {
        state.picoBoxes[box.eci] = box;
      }
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
    } catch (err) {
      state.error = err + "";
    } finally {
      state.loading = false;
    }
    notify();
  }

  function updateBox(eci: string, updates: Partial<PicoBox>) {
    if (state.picoBoxes.hasOwnProperty(eci)) {
      state.picoBoxes[eci] = {
        ...state.picoBoxes[eci],
        ...updates
      };
      notify();
    }
  }

  function setPicoMoving(p: PicoMoving | null) {
    state.picoMoving = p;
    notify();
  }

  return { use, fetchAll, updateBox, setPicoMoving };
})();
