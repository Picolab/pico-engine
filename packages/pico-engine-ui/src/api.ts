import { PicoBox } from "./types/PicoBox";

function apiResponse(resp: Promise<Response>) {
  return resp
    .then(async (resp) => {
      const text = await resp.text();
      if (text === "") {
        return null;
      }
      const json = JSON.parse(text);
      if (json === void 0) {
        return null;
      }
      return json;
    })
    .then((data) => {
      if (data?.error) {
        return Promise.reject(data.error);
      }
      return data;
    });
}

export function apiGet(path: string) {
  return apiResponse(fetch(path));
}

export function apiPost(path: string, body: any) {
  return apiResponse(
    fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    })
  );
}

export function apiSavePicoBox(
  eci: string,
  toUpdate: {
    name?: string;
    backgroundColor?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }
): Promise<PicoBox> {
  return apiPost(
    `/c/${eci}/event/engine_ui/box/query/io.picolabs.next/box`,
    toUpdate
  );
}

export async function getAllPicoBoxes(eci: string): Promise<PicoBox[]> {
  let results: PicoBox[] = [];

  const pico = await apiGet(`/c/${eci}/query/io.picolabs.next/box`);
  results.push(pico);

  for (const eci of pico.children) {
    results = results.concat(await getAllPicoBoxes(eci));
  }

  return results;
}
