export interface State {
  uiContext_apiSt: ApiCallStatus;
  uiContext?: {
    version: string;
    eci: string;
  };

  rulesets_apiSt: ApiCallStatus;
  rulesets: { [rid: string]: string[] };

  picos: {
    [eci: string]: PicoState;
  };

  pico_moving?: string;
  pico_resizing?: string;
}

export interface PicoState {
  box_apiSt: ApiCallStatus;
  box?: PicoBox;

  details_apiSt: ApiCallStatus;
  details?: PicoDetails;

  new_apiSt: ApiCallStatus;

  install_apiSt: ApiCallStatus;
  uninstall_apiSt: ApiCallStatus;

  addChannel_apiSt: ApiCallStatus;
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

export interface PicoDetails {
  parent: string | null;
  children: string[];
  channels: Channel[];
  rulesets: PicoRuleset[];
}
export interface PicoRuleset {
  rid: string;
  version: string;
  config: { [name: string]: any };
}
export interface Channel {
  id: string;
  tags: string[];
  eventPolicy: EventPolicy;
  queryPolicy: QueryPolicy;
  familyChannelPicoID: string | null;
}
export interface EventPolicy {
  allow: EventPolicyRule[];
  deny: EventPolicyRule[];
}
export interface EventPolicyRule {
  domain: string;
  name: string;
}
export interface QueryPolicy {
  allow: QueryPolicyRule[];
  deny: QueryPolicyRule[];
}
export interface QueryPolicyRule {
  rid: string;
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
  rulesets_apiSt: apiCallStatus.init(),
  rulesets: {},
  picos: {}
};
