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
