import test from 'ava';
import event from '../../src/modules/event';
import makeCoreAndKrlCtx from '../helpers/makeCoreAndKrlCtx';

test('didcomm library', async t => {
    const { krlCtx: ctx } = await makeCoreAndKrlCtx();
    const did = "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa";
    const diddoc = {
        did: did,
        key_agreements: [
            "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa#key-x25519-1"
        ],
        authentications: [
            "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa#key-1"
        ],
        verification_methods: [
            {
                id: "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa#key-x25519-1",
                type: "JsonWebKey2020",
                controller: "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa#key-x25519-1",
                verification_material: {
                    format: "JWK",
                    value: {
                        crv: "X25519",
                        kty: "OKP",
                        x: "avH0O2Y4tqLAq8y9zpianr8ajii5m4F_mICrzNlatXs"
                    }
                }
            },
            {
                id: "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa#key-1",
                type: "JsonWebKey2020",
                controller: "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa#key-1",
                verification_material: {
                    format: "JWK",
                    value: {
                        crv: "Ed25519",
                        kty: "OKP",
                        x: "G-boxFB6vOZBu-wXkm-9Lh79I8nf9Z50cILaOgKKGww",
                    },
                },
            }
        ],
        services: [
            "didsomething!"
        ]
    };

    const secrets = [
        {
            id: "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa#key-1",
            type: "JsonWebKey2020",
            secret_material: {
                format: "JWK",
                value: {
                    crv: "Ed25519",
                    d: "pFRUKkyzx4kHdJtFSnlPA9WzqkDT1HWV0xZ5OYZd2SY",
                    kty: "OKP",
                    x: "G-boxFB6vOZBu-wXkm-9Lh79I8nf9Z50cILaOgKKGww",
                },
            },
        },
        {
            id: "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa#key-x25519-1",
            type: "JsonWebKey2020",
            secret_material: {
                format: "JWK",
                value: {
                    crv: "X25519",
                    d: "r-jK2cO3taR8LQnJB1_ikLBTAnOtShJOsHXRUWT-aZA",
                    kty: "OKP",
                    x: "avH0O2Y4tqLAq8y9zpianr8ajii5m4F_mICrzNlatXs",
                }
            }
        }

    ];

    let peerExp : RegExp = new RegExp("^did:peer:(([01](z)([1-9a-km-zA-HJ-NP-Z]{46,47}))|(2((\.[AEVID](z)([1-9a-km-zA-HJ-NP-Z]{46,47}))+(\.(S)[0-9a-zA-Z=]*)?)))$", "g");
    console.log(peerExp.exec(did));

    ctx.rsCtx.putEnt("dids", { "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa": diddoc });
    event["send"](ctx, {"options": {"did": "did:peer:1zQmZMygzYqNwU6Uhmewx5Xepf2VLp5S4HLSwwgf2aiKZuwa", "domain": "localhost", "type": "didexchange", "attrs": {}}})
    // t.is(event, '');
    t.pass("yay");
});