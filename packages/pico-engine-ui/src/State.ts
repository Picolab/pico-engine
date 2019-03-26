export interface State {
  uiContext_apiSt: ApiCallStatus;
  uiContext?: {
    version: string;
    eci: string;
  };

  picos: {
    [eci: string]: {
      box_apiSt: ApiCallStatus;
      box?: PicoBox;
      // TODO separate query for ctx.pico()
    };
  };

  pico_moving?: string;
  pico_resizing?: string;
}

export interface PicoBox {
  eci: string;
  children: string[];

  name: string;
  backgroundColor: string;

  x: number;
  y: number;
  width: number;
  height: number;
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
  picos: {}
};
