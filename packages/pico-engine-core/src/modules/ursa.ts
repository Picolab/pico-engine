// Thanks to https://github.com/Picolab/node-sovrin-did/blob/master/index.js
import { PicoEngineCore } from "../PicoEngineCore";
import { krl } from "krl-stdlib";
const nacl = require('tweetnacl');
const bs58 = require('bs58');

const generateDID = krl.Function([], function () {
    const seed = nacl.randomBytes(nacl.sign.seedLength);
    const x = nacl.sign.keyPair.fromSeed(seed);
    const secretKey = x.secretKey.subarray(0,32);
    const signKey = bs58.encode(Buffer.from(secretKey));
    const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    return {
      did: bs58.encode(Buffer.from(x.publicKey.subarray(0,16))),
      verifyKey: bs58.encode(Buffer.from(x.publicKey)),
      encryptionPublicKey: bs58.encode(Buffer.from(keyPair.publicKey)),
      secret: {
        seed: Buffer.from(seed).toString('hex'),
        signKey: signKey,
        encryptionPrivateKey: bs58.encode(Buffer.from(keyPair.secretKey))
      }
    };
  });

export default function initUrsaModule(core: PicoEngineCore) {
  const module: krl.Module = {
    generateDID: generateDID,
  };
  return module;
}
