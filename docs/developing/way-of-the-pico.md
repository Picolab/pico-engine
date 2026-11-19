# Way of the Pico

Programming models shape how builders think, including when the builder is a coding agent. Picos are far enough from the usual model that a first application often comes out as a web service with a database. This page is the model itself: where picos came from, what they take from actors and Smalltalk, and the habits that make a pico system easy to change. The [overview](/pico-overview) says what a pico is. The [lessons](/lessons/) show how to program one. Start here when the code runs and still feels wrong.

## The model does the thinking

A language affects the system you get. A programming model affects which problems look easy, which look hard, and which do not look like problems at all. A coding agent does not arrive without a point of view. Most of the programs it has seen are a service that answers requests, a database that holds state, and a process that runs until someone restarts it. Ask for an application and that is what comes back, because that is the architecture it has seen most.

When code is cheap, an agent can generate a large working system in the wrong model in an afternoon. The mismatch shows up later, when the system has to change, grow, or move. The scarce skill is choosing the shape and noticing when generated code drifts out of it.

A model with small parts, clear boundaries, and explicit messages is also easier to check. You can look at one piece and know what it listens for, what it changes, and what it tells others.

Newcomers, human or agent, tend to make the same first system. One pico, named something like "manager," holds a map of every sensor, vehicle, or customer. Events are named like function calls (`update_sensor`, `get_status`, `do_report`). Something that needs to know about a change polls a query in a loop. The code runs. It fights the model the whole way.

Picos look familiar enough (rules, functions, JSON, HTTP) that those habits seem to apply. They do not. The sections below are the assumptions underneath the engine.

## Where picos came from

KRL began in 2007 at Kynetx, which Phil Windley co-founded with Steve Fulling. The language changed web pages on the fly: rules in the cloud responded to what a person was doing in the browser. Rules that react to events turned out to be useful beyond web pages. The things that ran the rules grew identity, storage, and channels to one another. By 2011 that picture was a personal event network: a personal cloud that sees events from the products and services a person uses and acts on that person's behalf.

The name came from a remark by Mickey McManus, an author of *Trillions*, about persistent data objects: packets of data that would live on the network indefinitely. Data alone was incomplete. If those packets could compute, they could act for whatever they represented. Persistent data objects became persistent compute objects, and persistent compute objects became picos. Pico is also the prefix for one-trillionth, which matched the idea of an internet populated by trillions of them, each carrying out its own mission in relationships with others. That picture was written down in 2013 and has guided the work since.

Most of what picos are came from use. CloudOS and SquareTag gave a person a pico for each of their things. Fuse, a connected-car platform, gave every vehicle a pico fed by an OBD-II device and showed how owners, fleets, and vehicles relate. A guard-tour system and a prototype of BYU's course registration showed how far one pico per entity could go. The design came out of those problems. It was not a plan for a distributed-actor language that happened to find a use.

## Messages matter more than objects

Picos are actors, in the sense Carl Hewitt introduced in 1973. An actor has private state. In response to a message it can send messages to actors it knows, create new actors, and decide how it will handle the next message. Actors share nothing. One actor cannot see or touch another's state. It can send a message and see what happens.

Alan Kay has said he regrets the word "object," because it got people to focus on the lesser idea. The big idea was messaging. He pictured a program as protected cells, each with its own membrane, interacting only through messages, each able to be as capable as a whole computer. That is not what most object-oriented languages became. Java and JavaScript objects are data structures with procedures attached, called synchronously, living inside one process. Take Kay's picture seriously and you end up close to actors.

A pico is that cell. It is not a row in a table or an instance in a heap. The membrane is the channel: the only way across is an event or a query on a channel the pico gave you. Designing a pico system is designing conversations. Ask what each pico knows, what it tells others, and what it needs to hear.

Erlang and Akka are mature actor systems, and they have been used to build systems larger than anything running on a pico engine today. They fit a process that does a job, crashes, and restarts. A pico stands for an entity. The pico that represents a truck has to remember its maintenance history, stay reachable by a mechanic, and belong to someone. Picos are actors built to be citizens of the internet.

## The running system is where you work

Smalltalk's other gift is the image. A Smalltalk system is alive. You work by moving around inside it, opening objects and sending messages, rather than only by editing files, compiling, and restarting. Programming picos feels like that because of three properties:

| Property | Meaning |
|----------|---------|
| **Persistent identity** | A pico exists from the moment it is created until someone deletes it. Since 1.6 that identity is a portable `did:webvh`. |
| **Persistent state** | Its state lives inside it, available to its rules and to nothing else. |
| **Persistent availability** | It is ready for the next event. Restarting the engine does not change which picos exist or what they know. |

Those properties remove the usual split between a service that holds behavior and a database that holds state. The state for an entity lives with the entity, next to the rules that use it. A rule that needs a sensor's last reading reads an entity variable in that sensor's pico. There is no schema to design up front and no connection pool to configure.

The running system is also visible. The developer UI shows the parent-child tree, the relationships, the channels, and the state each ruleset holds. You can raise an event on a running pico and watch what changes.

An image that exists only inside a running system is hard to version, share, and reproduce. Picos keep the source outside the image. Rulesets are files loaded from URLs, so they live in git and in whatever editor you use. Everything the UI does is available through an API, so a system can be built programmatically and rebuilt from nothing. The image is where the system lives. The code does not hide there.

## One entity, one pico

Start with the nouns. Before services, endpoints, or tables, find the things in the problem that have an identity and a lifetime: a person, a vehicle, a sensor, a course section, a household, an organization. Each of those gets a pico. The question is "who is this about?"

The thing does not have to be smart. A pothole has no processor and no network connection. It has a location, a history, and people who care about it: the driver who reported it, the engineer who wants to see the water lines underneath, and the crew that will fill it. A pico for the pothole can remember that history and present a different view to each party it has a relationship with. Most things in the world will never be instrumented. They can still be on the internet.

A sensor network is the other case. The devices are small, battery-powered, and asleep most of the time. Each has a pico that acts as its digital twin: decoding payloads, keeping history, checking thresholds, and sending notifications. The sensor is the body. The pico is the memory and the judgment.

This does not mean too many picos. Picos are cheap, and because they share nothing they run concurrently without locks. A prototype of course registration at BYU gave each course section its own pico, and replaying a semester of registration into thousands of section picos ran on a laptop. One pico holding a map of every section is a bottleneck and a single point of failure. A pico with a map of everything is usually a sign that some picos are missing.

## Events say what happened

Picos talk in two ways. A query asks for a value by calling a function the pico has chosen to share, and it has no side effects. An event says that something happened, and events are the only way a pico's state changes. The [event-query API](/exp/) is not REST. A pico's API is whatever its installed rulesets listen for and share, and it changes as rulesets come and go.

Name events as facts, not commands. A fact says what happened: `sensor:new_readings`, `vehicle:trip_completed`, `community:thing_created`. A command says what someone wants done: `update_sensor`, `send_alert`, `process_trip`. A command assumes the sender knows who will act and what they will do. A fact assumes neither. The sender reports what it saw, and any rule that cares can respond.

Rules have functionality. Events do not. Whether anything happens depends on which rules are installed, what their event expressions select, what conditions they check, and what state the pico is in. The same event can do nothing in one pico and start a cascade in another. To know what a pico does, read its rules. Its event names only say what it can hear.

A router ruleset can decode a payload and raise a fact without knowing what happens next:

```krl
rule decode {
  select when lorawan uplink
  pre {
    readings = decode(event:attr("payload"))
  }
  always {
    raise sensor event "new_readings" attributes readings
  }
}
```

A thresholds ruleset, written separately and installed later, listens for that fact:

```krl
rule check_low_temperature {
  select when sensor new_readings
  pre {
    temperature = event:attr("temperature").as("Number")
    min = ent:thresholds{"min_temperature"} || 35
  }
  if temperature < min then noop()
  fired {
    raise sensor event "threshold_violation" attributes event:attrs
  }
}
```

Neither rule knows about the other. A history ruleset, a plotting ruleset, or a ruleset that feeds Home Assistant can listen for the same event without changing either one.

## Let functionality accrete

Every pico has an internal event bus. Installing a ruleset starts its rules listening. Removing it stops them. Nothing else has to change. Add capabilities by installing rulesets, layer on layer, rather than by editing a central dispatcher or redeploying a service. Each rule is a small piece of behavior for one entity. The [event loop](/developing/event-loop) is what happens inside one pico when an event arrives.

Accretion has costs, and the design has to pay them:

- Rules from different rulesets may respond to the same event in an order you do not control. Each rule should do its job without depending on what another rule did first.
- Events can arrive more than once. A rule should be idempotent where it can: running it twice should leave the pico in the same state as running it once.
- When an action is not naturally idempotent, a guard rule can check state first and decide whether to proceed.

A pico may outlive several owners, several apps, and several versions of every ruleset installed in it. Rulesets that migrate their own state when they are updated, and rules that repair inconsistent state when they find it, let the system change while it runs. You tend a pico system more than you redeploy it.

A garden is a better picture than a building. You plant something new where there is room, graft a new variety onto rootstock that is already established, prune what has grown wrong, and amend the soil when something is not thriving. Adding a pico is planting. Installing a ruleset on an existing pico is grafting. Migration and repair rules are the pruning. The garden keeps living between visits.

## Asynchrony is the normal case

Picos do not wait. When one pico sends an event to another, it does not block for an answer. It goes on handling its own events, and any response arrives later as another event. This is the habit that trips people most, because most programming is a call that returns a value for the next line to use.

Make the conversation explicit. If a rule needs another pico to do something and wants to know when it is done, send the request with a callback channel and a correlation id (`rcn`), store the context you will need under that id, and finish the work in a separate rule that selects on the callback. Manifold uses this throughout: an app asks Manifold to create a thing pico, passes its own callback channel and an `rcn`, and completes its setup when `thing_created` comes back. Scheduling an event a few seconds out and hoping the work is finished is a race. Hope is not a coordination mechanism.

Errors are events too. A rule that fails cannot throw an exception up a call stack, because there is no call stack between picos. Rules raise error events that other rules can handle, retry, or report. A sensor does not wait for someone to read its temperature. Dropping a truck at the shop means leaving a phone number and a work order, and hearing back when the work is done.

## Rights are relationships

Every pico except a root has a parent. The parent-child tree is how picos are created, initialized, and administered. Control of a root implies control of everything beneath it. The tree is not the application. Applications run on the graph of [relationships](/wrangler/relationships) between picos. That graph crosses the tree, crosses meshes, and crosses engines.

Older material calls these connections subscriptions. What a pico forms is a relationship: pairwise, bidirectional, introduced by someone who already knows both sides, governed by policy, and long-lived. A truck's pico has relationships with its co-owners, a borrower, an insurer, and the DMV, each with its own rights.

Rights belong to relationships, not to attributes. In a typical application, ownership is a column: the vehicle row has an owner id. In Fuse, ownership was a relationship between an owner pico and a fleet pico, so a fleet could have two owners by having two relationships, and a new owner could be added by an introduction from an existing one. Lending the truck is another relationship with fewer rights. Revoking it means ending that relationship.

Channels make this concrete. A pico has as many channels as it needs, and each channel's policy says which events and queries may cross it. A channel identifier works like a capability: holding one lets you do what its policy allows. A separate channel for each relationship means a webhook can raise only the event it needs, one partner cannot correlate activity across relationships, and revoking one party does not disturb the others. If a rule checks a caller's identity to decide what they may do, that decision probably belongs in a channel policy.

A channel policy says what a caller may do. When two picos on different engines form a relationship, each also needs to know who is on the other end. A person unlocks their root pico with a passkey, so the root is that person's actor on the mesh. Picos identify themselves to each other with DIDs (`did:webvh` for each pico, a peer DID for each relationship), with no central identity provider. Outside software reaches a mesh with OAuth tokens scoped to particular channels. Identity, like rights, lives in each pico and each relationship.

## Keep the bottom small

The stack is layered, and the layering is a design rule:

| Layer | What it knows |
|-------|----------------|
| **Engine** | Picos, channels, policy, persistence, identity. Nothing about a domain. |
| **Wrangler** | The pico operating system: children, channels, rulesets, and relationships, in KRL. |
| **Manifold** | A vocabulary for meshes: owners, things, communities, registries. |
| **Applications** | A sensor network, a registration system, a household. Built on Manifold. |

Each layer stays ignorant of the ones above it. If a change to the engine or Wrangler needs the word "owner" or "thing," it belongs in Manifold. If a change to Manifold needs the word "sensor," it belongs in the sensor network. Every domain word that leaks downward makes the lower layers less general, and generality is the point. Picos can model a person, a truck, a beehive, or a pothole because the engine does not know what any of those are.

The same restraint applies when the engine itself grows. The first question for a new capability is whether it can be a ruleset. Most of the time it can. An engine change is a commitment for everyone who runs an engine. A ruleset is a choice an individual pico makes.

## A pico should be able to leave

Most of the internet is organized around services. You have an account with each company, your data lives in their systems, and your identity is whatever they say it is. Johannes Ernst described the difference between service-oriented and subject-oriented clouds. The service-oriented version for devices is a world of silos, where a thermostat works only as long as its manufacturer's cloud does.

Picos are subject-oriented. Each pico represents something, and what it represents is a different question from who owns it. Ownership follows the tree. A pico belongs to whoever controls the root of the mesh it lives in, not to the vendor whose rulesets it runs or the company whose engine hosts it. A truck's pico represents the truck and lives in the owner's mesh, under the root unlocked with the owner's passkey. When the truck is sold, its pico can move to the buyer's mesh, history included, and become theirs.

That ownership is real only if the pico can leave. Most people will not run a server, so their picos will live on someone else's engine: a community server, a cloud host, or a machine a family member keeps running. Being able to move means taking state, rulesets, and relationships to another host without asking permission.

A pico's `did:webvh` survives a move. Relationships anchored in peer DIDs, rather than in the host's addresses, go with it. When you design a system, assume the picos will move. Do not store things that only make sense on one engine. Do not hardcode another pico's location when a relationship would do. Do not build anything that works only if the host never changes.

## Picos and coding agents

Picos are actors, not agents. Much of what people want from an AI agent is already what a pico provides: a durable identity, memory that belongs to its owner, a way to hear about events, and limits on what a caller can do. The pico is the memory. A model is the reasoner. A pico raises an event, a model reasons about it, and the result comes back as another event that rules check before anything happens. The model proposes. The pico decides.

The engine's remote MCP server presents a pico's events and queries as tools, limited to the rulesets installed on that pico and the policy of the channel in use. A mesh endpoint can walk the subtree and call only the channels an administrator has exposed. A model can do only what those channels allow. Connecting a client is [AI tools over MCP](/developing/mcp-ai-tools).

Coding agents write more of the KRL. The habits on this page apply to them as much as to people. The repository's `CLAUDE.md` and `AGENTS.md` spell out the layering rule and the KRL conventions, and each ruleset can describe its own events and queries. An agent that understands why picos are shaped this way writes better KRL than one that has only memorized the syntax.

## Signs you're fighting the model

When a pico application feels harder than it should, a familiar habit has usually crept back in:

- **One pico with a map of everything.** If a pico holds a collection of entities that each have their own identity and history, those entities need their own picos.
- **Events named like functions.** `do_report` and `update_status` are commands. They can be rule names. Event names should be the fact that happened.
- **Polling with queries.** If you keep asking whether something changed, have the pico raise an event when it does.
- **Scheduling and hoping.** A scheduled event that assumes other work has finished is a race. Use a callback and a correlation id.
- **Permissions as attributes.** An owner field or a role check inside a rule usually wants to be a relationship and a channel policy.
- **Reaching for a database.** State about an entity belongs in that entity's pico. An external store is for data that belongs to someone else.
- **Domain words in lower layers.** If the engine or Wrangler needs to know what a sensor is, the change is in the wrong place.
- **Assuming the host never changes.** Hardcoded URLs and engine-specific identifiers break the day a pico moves.

None of these stop a program from running. They make it harder to change, harder to compose with other rulesets, and harder to move. Most of them come from treating a pico as a container for code rather than as the representative of something in the world.

## What the habits add up to

A pico is a small, always-on computer that stands in for one thing, remembers what has happened to it, listens for what happens next, and holds relationships with the other things it cares about. Programming picos well means modeling the world as it is: entities with identity and history, telling each other what happened, with rights that live in their relationships and a home they are free to leave. Get the model right and the KRL follows.

The habits are more than technique. A pico's state is its own, and you ask rather than reach in. You say what you know and leave others free to act on it. You wait for a system that answers in its own time and grows by accretion rather than by replacement. You keep the bottom layers small, give each part one job, and let the whole emerge from parts that do not need to know about each other.

Every pico represents something, and that something belongs to someone: a person, a family, a small organization, a community. A pico that holds its owner's data, acts on its owner's behalf, keeps relationships on its owner's terms, and can move when its owner wants is software that serves the people it touches. The name pico came from a picture of trillions of them, each carrying out its own mission, connected by relationships rather than by accounts in someone else's system. That is an ecosystem, which is why building with picos is closer to tending a garden than to designing a building.

Machines writing the code does not change the choice. The model still decides what the builder sees, whether the builder is a person writing a first ruleset or an agent generating a hundred of them.

---

<small>Adapted from Phil Windley's essay <a href="https://www.windley.com/archives/2026/11/way_of_the_pico.shtml">Way of the Pico</a> (November 2026).</small>
