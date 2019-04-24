export interface State {
  uiContext_apiSt: ApiCallStatus;
  uiContext?: {
    version: string;
    eci: string;
  };

  rulesets_apiSt: ApiCallStatus;
  rulesets: {
    [rid: string]: {
      [version: string]: RulesetState;
    };
  };

  picos: {
    [eci: string]: PicoState;
  };

  pico_moving?: string;
  pico_moving_relX?: number;
  pico_moving_relY?: number;
  pico_resizing?: string;

  rulesetPage: RulesetPageState;
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
  delChannel_apiSt: ApiCallStatus;

  testing: {
    [rid: string]: { schema_apiSt: ApiCallStatus; schema?: TestingSchema };
  };

  testingECI?: string;

  testResult_error?: string;
  testResult?: any;
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

export interface TestingSchema {
  queries?: { name: string; args?: string[] }[];
  events?: { domain: string; name: string; attrs?: string[] }[];
}

export interface RulesetPageState {
  newRuleset_ridInput: string;
  newRuleset_apiSt: ApiCallStatus;

  theme: string | null;
  status: string | null;
}

export interface RulesetState {
  rid: string;
  version: string;

  krl_apiSt: ApiCallStatus;
  krl: string | null;
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
  picos: {},

  rulesetPage: {
    newRuleset_ridInput: "",
    newRuleset_apiSt: apiCallStatus.init(),
    theme: localStorage["krl-editor-theme"] || null,
    status: null
  }
};
