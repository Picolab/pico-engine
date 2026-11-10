# Evented Systems vs Request-Response Systems

Event-based systems differ markedly from request-based systems. Event-based and request-based systems are duals of each other. Whereas the receipt of a request triggers the action of a request-response system, the receipt of an event triggers event-driven systems. The nature of an event is different from that of a request. A request says, "Do this for me." In contrast, an event says, "This happened." In a request-driven system, the sender chooses what action to take. In an event-driven system, the sender merely says that something happened. Event processors have no obligation to the event generator. Event generators are obligated to report events and respond to directives. Conversely, a client in a request-driven system has no obligation to the server. It can make a request or not. Servers are expected to fulfill requests. The following table summarizes these differences.

|  | **Request-Based** | **Event-Based** |
| --- | --- | --- |
| Signal | Request receipt | Event receipt |
| Nature | "Do this" | "Something happened" |
| Obligation | At server | At event generator (client) |
| Interpretation | On client | On server |

Event processors interpret what an event means. A request, on the other hand, implies that the interpretation of what should happen has already occurred. You can think of this as receiver, instead of sender, determinism.

Because of these differences, the flow control of event-processing systems is very different from that of request-response systems. Consequently, applications are constructed differently in event-driven systems. The language at the heart of KRL, the Kinetic Rule Language, is optimized for building reactive, event-based applications.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189842) (last edited there 2019-01-09).</small>
