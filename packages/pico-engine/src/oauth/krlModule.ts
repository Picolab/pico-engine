import { krl } from "krl-stdlib";
import { OAuthService } from "./OAuthService";

export default function initOAuthModule(oauth: OAuthService) {
  const module: krl.Module = {
    channelStatus: krl.Function(["eci"], function (eci: string) {
      return oauth.channelStatusAsync(eci);
    }),

    meshRequiresOAuth: krl.Function(["eci"], function (eci: string) {
      return oauth.meshRequiresOAuth(eci);
    }),

    createChannelSecret: krl.Function(["eci"], function (eci: string) {
      oauth.assertChannelManagedBy(eci, this.rsCtx.pico().id);
      return oauth.createChannelSecret(eci);
    }),

    revokeChannelSecret: krl.Function(["eci"], function (eci: string) {
      oauth.assertChannelManagedBy(eci, this.rsCtx.pico().id);
      return oauth.revokeChannelSecret(eci).then(() => ({ ok: true }));
    }),

    revokeTokens: krl.Function(["eci"], function (eci: string) {
      oauth.assertChannelManagedBy(eci, this.rsCtx.pico().id);
      return oauth.revokeTokens(eci).then(() => ({ ok: true }));
    }),
  };

  return module;
}
