export interface State {
  uiContext_apiSt: ApiCallStatus;
  uiContext?: {
    version: string;
    eci: string;
  };

  // TODO load from channel query
  rootPico: PicoBox;

  pico_moving?: string;
  pico_resizing?: string;
}

export interface PicoBox {
  eci: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;

  name: string;
}

export interface ApiCallStatus {
  waiting: boolean;
  error?: string | null;
}

/**
 * Convenience functions for ApiCallStatus
 */
export const apiCallStatus = {
  init(): ApiCallStatus {
    return { waiting: false };
  },
  waiting(): ApiCallStatus {
    return { waiting: true };
  },
  ok(): ApiCallStatus {
    return { waiting: false };
  },
  error(error: string): ApiCallStatus {
    return { waiting: false, error };
  }
};

export const initialState: State = {
  uiContext_apiSt: apiCallStatus.init(),

  // TODO load from channel query
  rootPico: {
    eci: "foo",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    backgroundColor: "#87cefa",

    name: "TEST"
  }
};
