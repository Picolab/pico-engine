/**
 * KRL telnet module, against a local TCP server that answers each line.
 */

import test from "ava";
import * as net from "net";
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx";

function echoServer(): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const sockets: net.Socket[] = [];
    const server = net.createServer((sock) => {
      sockets.push(sock);
      sock.on("data", (data) => {
        const line = data.toString().trim();
        if (line) {
          sock.write("you said " + line + "\r\n");
        }
      });
    });
    server.listen(0, "127.0.0.1", () => {
      resolve({
        port: (server.address() as net.AddressInfo).port,
        close: () => {
          sockets.forEach((s) => s.destroy());
          server.close();
        },
      });
    });
  });
}

test("module - telnet:*", async function (t) {
  const { core, krlCtx: ctx } = await makeCoreAndKrlCtx();
  const telnet = core.modules["telnet"];
  const server = await echoServer();

  t.like(await telnet.parameters(ctx, []), { host: "127.0.0.1", port: 23 });
  await t.throwsAsync(telnet.query(ctx, ["hi"]), { message: /use telnet:connect first/ });

  const res = await telnet.connect(ctx, [
    { port: server.port, negotiationMandatory: false, initialLFCR: false, password: "secret", sendTimeout: 300 },
  ]);
  t.deepEqual(res, { connected: true, host: "127.0.0.1", port: server.port });
  t.is(await telnet.host(ctx, []), "127.0.0.1");
  const params = await telnet.parameters(ctx, []);
  t.is(params.port, server.port);
  t.false("password" in params, "parameters() never returns the password");

  t.is((await telnet.query(ctx, ["hello"])).trim(), "you said hello");
  t.is((await telnet.sendCMD(ctx, ["again"])).trim(), "you said again");
  await t.throwsAsync(telnet.query(ctx, [null]), { message: /needs a command string/ });

  await telnet.disconnect(ctx, []);
  await t.throwsAsync(telnet.sendCMD(ctx, ["gone"]), { message: /use telnet:connect first/ });

  server.close();
  const refused = await telnet.connect(ctx, [{ port: server.port, negotiationMandatory: false }]);
  t.like(refused, { connected: false, port: server.port });
  t.truthy(refused.error);
});
