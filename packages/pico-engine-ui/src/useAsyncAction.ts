import * as React from "react";

export interface AsyncActionState {
  waiting: boolean;
  error: string | null;
}

export interface AsyncAction<P> extends AsyncActionState {
  act(params: P): Promise<any>;
}

function useAsyncAction<P>(action: (params: P) => any): AsyncAction<P> {
  const [state, setState] = React.useState<AsyncActionState>({
    waiting: false,
    error: null
  });

  return { ...state, act };

  async function act(params: P) {
    setState({ waiting: true, error: null });
    try {
      await action(params);
      setState({ waiting: false, error: null });
    } catch (err) {
      setState({ waiting: false, error: err + "" });
    }
  }
}

export default useAsyncAction;
