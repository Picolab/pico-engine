import * as path from "path";

export function toFileUrl(str: string) {
  var pathName = path.resolve(str).replace(/\\/g, "/");
  if (pathName[0] !== "/") {
    pathName = "/" + pathName; // for windows
  }
  return encodeURI("file://" + pathName);
}
