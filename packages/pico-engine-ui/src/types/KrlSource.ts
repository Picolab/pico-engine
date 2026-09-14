export interface KrlSource {
  rid: string;
  filename: string;
  relativePath: string;
  url: string;
  name?: string;
  description?: string;
  rootOnly?: boolean;
}
