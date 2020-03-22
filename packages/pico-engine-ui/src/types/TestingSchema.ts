export interface TestingSchema {
  queries?: { name: string; args?: string[] }[];
  events?: { domain: string; name: string; attrs?: string[] }[];
}
