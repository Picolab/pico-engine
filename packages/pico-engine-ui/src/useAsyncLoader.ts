import * as React from "react";

export interface AsyncLoaderState<T> {
  waiting: boolean;
  error: string | null;
  data: T;
}

export interface AsyncLoader<T> extends AsyncLoaderState<T> {
  load(): Promise<void>;
  hardReload(): Promise<void>;
  setData(data: T): void;
}

function useAsyncLoader<T>(
  fallback: T,
  loader: () => T | Promise<T>
): AsyncLoader<T> {
  const [state, setState] = React.useState<AsyncLoaderState<T>>({
    waiting: false,
    error: null,
    data: fallback
  });

  return { ...state, load, hardReload, setData };

  async function load() {
    setState({ waiting: true, error: null, data: state.data });
    try {
      const data = await loader();
      setState({ waiting: false, error: null, data });
    } catch (err) {
      setState({ waiting: false, error: err + "", data: state.data });
    }
  }

  async function hardReload() {
    setState({ waiting: true, error: null, data: fallback });
    try {
      const data = await loader();
      setState({ waiting: false, error: null, data });
    } catch (err) {
      setState({ waiting: false, error: err + "", data: fallback });
    }
  }

  function setData(data: T) {
    setState({ ...state, data });
  }
}

export default useAsyncLoader;
