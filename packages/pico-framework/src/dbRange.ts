import { AbstractIteratorOptions } from "abstract-level";
import { PicoDb, PicoDbKey } from "./utils";

export async function dbRange<T = any>(
  db: PicoDb,
  opts: { prefix?: PicoDbKey },
  onData: (data: any) => Promise<T> | T,
): Promise<T[]> {
  const promises: Promise<T>[] = [];

  let streamOpts: AbstractIteratorOptions<PicoDbKey, any> = {};
  if (opts && Array.isArray(opts.prefix)) {
    streamOpts.gte = opts.prefix;
    streamOpts.lte = opts.prefix.concat([undefined] as any); // bytewise sorts with null at the bottom and undefined at the top
  }
  const iter = db.iterator(streamOpts);
  for await (const [key, value] of iter) {
    promises.push(Promise.resolve(onData({ key, value })));
  }
  return await Promise.all(promises);
}
