import test from 'ava';
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx"


test('genDID', async t => {
    const {core, krlCtx} = await makeCoreAndKrlCtx();
    const dido = core.modules["dido"];
    var doc = await dido["generateDID"](krlCtx, ["key", "http://localhost:3000"]);
    var doc2 = await dido["generateDID"](krlCtx, ["key", "http://localhost:3000"]);
    console.log(JSON.stringify(doc));
    var message = {
        id: doc["did"],
        typ: "application/didcomm-plain+json",
        type: "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/out-of-band/1.1/invitation",
        body: "test"
    };
    var packed_msg = await dido["pack"](krlCtx, [message, doc["did"], doc2["did"]]);
    console.log("------------------PACKED---------------------")
    console.log(JSON.stringify(packed_msg));
    var unpacked_msg = (await dido["unpack"](krlCtx, [packed_msg])).as_value();
    console.log("------------------UNPACKED-------------------")
    console.log(unpacked_msg)
    t.is(unpacked_msg.id, message.id, "Id's don't match");
    t.is(unpacked_msg.typ, message.typ, "Typs don't match");
    t.is(unpacked_msg.type, message.type, "Types don't match");
    t.is(unpacked_msg.body, message.body, "Bodies don't match");
});