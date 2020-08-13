import { LevelUp } from "levelup";
import * as _ from "lodash";

export function dbRange<T = any>(
  ldb: LevelUp,
  opts: any,
  onData: (data: any, stop: () => void) => Promise<T> | T
): Promise<T[]> {
  return new Promise(function(resolve, reject) {
    const promises: Promise<T>[] = [];

    let hasCalledback = false;
    function callback(err?: any) {
      if (hasCalledback) return;
      hasCalledback = true;
      if (err) {
        return reject(err);
      }
      Promise.all(promises)
        .then(resolve)
        .catch(reject);
    }

    if (_.has(opts, "prefix")) {
      opts = _.assign({}, opts, {
        gte: opts.prefix,
        lte: opts.prefix.concat([undefined]) // bytewise sorts with null at the bottom and undefined at the top
      });
      delete opts.prefix;
    }
    const s = ldb.createReadStream(opts);
    function stopRange() {
      (s as any).destroy();
      callback();
    }
    s.on("error", function(err) {
      callback(err);
    });
    s.on("end", callback);
    s.on("data", function(data) {
      promises.push(Promise.resolve(onData(data, stopRange)));
    });
  });
}
