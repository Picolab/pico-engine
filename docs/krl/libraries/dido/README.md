# dido

> **Note:**
>
> This pages describes a module that provides basic functions for decentralized identifiers.
>
> The module is under development and should not be used

DID stands for Decentralized Identifier, which is a type of identifier that is unique and persistent. It is designed to be self-owned, meaning that individuals and organizations can create and control their own DIDs without the need for a centralized authority. DID allows for secure and private interactions between parties without the need for a third-party intermediary.

DIDComm, on the other hand, is a secure messaging protocol that enables secure communication between parties who have exchanged DIDs. DIDComm provides a way for parties to exchange messages securely, authenticate each other, and establish secure channels for further communication.

Dido is a library created for KRL developers to use DIDs and DIDComm in their rulesets. With Dido, developers can create, use, and manage DIDs, as well as pack and unpack DIDComm messages. The [dido.ts library](/krl/libraries/dido/dido-library) is used in the [dido.krl ruleset](/krl/libraries/dido/dido-ruleset) to establish connections, and from there, developers can implement various DIDComm protocols, such as the [tic-tac-toe example](/krl/libraries/dido/tic-tac-toe-ruleset). The implementation used in dido.ts and dido.krl is [v2](https://identity.foundation/didcomm-messaging/spec/#plaintext-message-structure)*, but the functionality of key rotation is not implemented and is something that has to be done in the future. By leveraging DIDs and DIDComm, developers can create secure and decentralized systems that enable trust and privacy in digital interactions.

*This implementation of DIDs is a [Peer 2 DID](https://identity.foundation/peer-did-method-spec/#generation-method).

---

- [dido library](/krl/libraries/dido/dido-library)
- [dido ruleset](/krl/libraries/dido/dido-ruleset)
- [tic tac toe ruleset](/krl/libraries/dido/tic-tac-toe-ruleset)
- [future plans](/krl/libraries/dido/future-plans)
- [Pico Engine DIDCommV2 Message Types](/krl/libraries/dido/pico-engine-didcommv2-message-types)

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/2396389381) (last edited there 2023-04-19).</small>
