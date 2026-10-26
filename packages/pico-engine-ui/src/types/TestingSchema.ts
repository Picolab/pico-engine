export interface TestingSchema {
  queries?: {
    name: string;
    args?: string[];
    exampleName?: string;
    defaults?: Record<string, string | number | boolean>;
  }[];
  events?: {
    domain: string;
    name: string;
    attrs?: string[];
    exampleName?: string;
    defaults?: Record<string, string | number | boolean>;
  }[];
}
