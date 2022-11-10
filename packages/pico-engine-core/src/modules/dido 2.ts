import { krl } from "krl-stdlib";
import { Message, DIDDoc, DIDResolver, Secret, SecretsResolver } from "didcomm";

const send = krl.Function([], function(did) {
    console.log("send!")
});

const dido: krl.Module = {
    send: send,
}

export default dido;