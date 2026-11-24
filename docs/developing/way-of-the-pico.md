# Way of the Pico

**[Phil Windley](https://www.windley.com)**, creator of the pico model. This is an introduction, in the first person, to how the model wants to be used.

Programming models shape how builders think, and that is still true when the builder is a coding agent. Picos are a programming model far enough from the mainstream that most developers, human or not, start out writing them like a web service with a database. This page is that mindset: where picos came from, what they borrow from actors and Smalltalk, and the habits of thought that make them easy to work with instead of strange. It is not a tutorial. The [Pico Labs documentation](https://picolabs.atlassian.net/wiki/spaces/docs/overview) and the [pico overview](/pico-overview) in the [engine repo](https://github.com/Picolab/pico-engine) cover what picos are and how to program them.

I've always been intrigued by programming models. In grad school I gravitated to languages that were outside the mainstream. Smalltalk offered an intriguing look at objects. Prolog offered declarative programming through rules. Lisp seemed foundational, capable of exploring the essence of what it means to program. My dissertation was in hardware verification using a system called HOL, which was built (and extended) in a functional language called ML.

As a professor, I taught the programming models class and made my students spend the entire semester in Scheme so they would have to think in a new way. That idea is important. The choice of programming language has a great impact on important properties of the resulting system, but the choice of programming model has an even larger impact on the way the builders think. A model decides which problems look easy, which look hard, and which don't look like problems at all.

Even in the age of AI, where machines generate much of the code, the choice of models and frameworks shapes how the builders, human or not, approach the problem. A coding agent doesn't arrive without a point of view. It has absorbed millions of programs, and most of them share a model: a service that answers requests, a database that holds state, and a process that runs until someone restarts it. Ask an agent for an application and that's what you get, because it's the architecture the agent has seen most, not because it fits the problem. The model is still doing the thinking; it's just doing it where no one can see it.

If anything, models matter more now. When code was expensive, the cost of writing it limited how far a poor architecture could spread. When code is cheap, an agent can generate a large, working system in the wrong model in an afternoon, and nobody notices the mismatch until the system has to change, grow, or move. The scarce skill isn't writing the code anymore. It's choosing the shape the code should take and noticing when generated code drifts out of it.

This isn't an abstract worry for me. In [One Billion Thousand-Dollar Markets](https://www.windley.com/archives/2026/11/one_billion_thousand-dollar_markets.shtml), I argued that cheap software will let small organizations have software built to fit how they actually work. Most of that software will be written with an agent's help, and the model the agent works in will decide whether the result belongs to the people who use it or just runs on someone's server. A good model also makes generated code easier to check. When the parts are small, the boundaries are clear, and the messages between parts are explicit, you can look at one piece and know what it listens for, what it changes, and what it tells others. That's a property of the model, not the language, and it's what I want from any system I'll have to live with for years.

Picos are a programming model, and one far enough from the mainstream that newcomers usually bring the wrong model with them. I see it almost every time a student or a new contributor writes their first pico application. They create one pico, call it something like "manager," and give it a map of every sensor, vehicle, or customer in the system. They name their events like function calls (`update_sensor`, `get_status`, `do_report`) and poll a query in a loop when they need to know whether something changed. The code runs, but it fights the model at every turn; it's a web service with a database, wearing a pico costume.

Coding agents do exactly the same thing. Picos look familiar enough (rules, functions, JSON, HTTP) that familiar habits seem to apply. They don't. Picos rest on a different set of assumptions about what a program is, and without those assumptions the engine feels strange in ways that are hard to name. The rest of this page names them. I've been working on this idea in one form or another for almost twenty years, and the mindset is the part I've found hardest to write down.

## Where picos came from

I didn't set out to build a programming model for distributed systems. In 2007 I co-founded Kynetx with Steve Fulling, and KRL began life as a language for changing web pages on the fly, using rules that lived in the cloud and responded to what a person was doing in the browser. Rules that react to events turned out to be good for much more than web pages. Over the next few years [the language got away from me](https://www.linuxjournal.com/content/true-internet-things), and the things that ran those rules grew identity, storage, and channels to one another. By 2011 I was writing about [personal event networks](https://www.windley.com/archives/2011/11/personal_event_networks_and_value.shtml): a personal cloud that sees events from all the products and services a person uses and acts on that person's behalf.

The name came later. Mickey McManus, one of the authors of [*Trillions*](http://www.amazon.com/exec/obidos/ASIN/B008SGNFJQ/technometria-20), talked about persistent data objects, packets of data that would live on the network indefinitely. The idea stuck with me, but it seemed incomplete. Why should they only be data? If they could compute, they could act on that data for whatever they represented, so persistent data objects became persistent compute objects, and persistent compute objects, PCOs, became picos.

The name fit for another reason. Pico is the prefix for one-trillionth, which seemed right for an idea I'd picked up from a book called *Trillions*. I imagined an internet populated by trillions of picos, each persistently carrying out its individual mission in relationships with others. I wrote down their [fundamental features](https://www.windley.com/archives/2013/10/fundamental_features_of_persistent_compute_objects.shtml) in 2013, and that picture of the internet has guided the work ever since.

Most of what picos are came from real use. CloudOS and [SquareTag](https://www.windley.com/tags/squaretag.shtml) gave people a pico for each of their things. [Fuse](https://www.windley.com/tags/fuse.shtml), a connected-car platform, gave every vehicle a pico fed by an OBD-II device and taught us how owners, fleets, and vehicles relate to each other. A guard-tour system and a prototype of BYU's course registration showed how far the idea of one pico per entity could go. The [design emerged](https://www.windley.com/archives/2022/07/the_most_inventive_thing_ive_done.shtml) from those projects rather than from a plan. If I had set out in 2007 to design a language for distributed actors, I doubt I would have succeeded; what I got instead is a model shaped by the problems it had to solve.

## Messages matter more than objects

Picos are actors. [Carl Hewitt](https://en.wikipedia.org/wiki/Carl_Hewitt) introduced the actor model in 1973: an actor has private state, and in response to a message it can send messages to actors it knows, create new actors, and decide how it will handle the next message. Actors share nothing. One actor can't see or touch another's state; it can only send a message and see what happens. I traced the line from closures through objects and actors to picos in [Closures, Objects, Actors, and Picos](https://www.windley.com/archives/2026/10/closures_objects_actors_and_picos.shtml), so I won't repeat it here. The point is what that lineage means for how you think.

[Alan Kay](https://en.wikipedia.org/wiki/Alan_Kay), who led the team that built Smalltalk, has said many times that he regrets the word object, because it got people to focus on ["the lesser idea."](https://lists.squeakfoundation.org/pipermail/squeak-dev/1999-May/005143.html) The big idea was messaging. Kay had studied molecular biology, and he imagined a program as a collection of protected cells, each with its own membrane, that interact only through messages and could each be as capable as the whole computer. That isn't what most of us learned as object-oriented programming. Java and JavaScript objects are data structures with procedures attached, called synchronously, living inside one process. If you imagine what Kay wanted objects to be, you end up somewhere very close to actors.

Picos take that seriously. A pico isn't a row in a table or an instance in a heap; it's a cell. It has a membrane, and the only way across that membrane is an event or a query sent on a channel the pico gave you. When you design a pico system, you're designing conversations between cells. Ask what each pico knows, what it tells others, and what it needs to hear, rather than what tables you need.

Picos aren't the only actor system, and they aren't the right choice for every problem. Erlang and Akka are mature, fast, and have been used to build systems far larger than anything running on a pico engine today. Where picos differ is in what they assume an actor is for, and that comes from the problems picos grew up on. A process that does a job can crash and restart and nobody minds. An entity that represents my truck has to remember its maintenance history, has to be reachable by my mechanic, and has to belong to me. Picos are actors built to be first-class citizens of the internet.

## Living inside the system

Smalltalk gave picos a second idea: the image. A Smalltalk system is alive. Every object in it can be opened, inspected, and sent messages, and a developer works by moving around inside the running system rather than editing files, compiling, and restarting. When [Jon Udell](https://jonudell.net) and [r0ml](https://github.com/r0ml) pointed out that Postgres could work like a Smalltalk image, I was struck by how much programming picos already felt that way, and I wrote about it in [Persistence, Programming, and Picos](https://www.windley.com/archives/2021/02/persistence_programming_and_picos.shtml).

Persistence is what makes the image possible. Picos have persistent identity, persistent state, and persistent availability. A pico exists from the moment it's created until someone deletes it; its state lives inside it, available to its rules and to nothing else; and it's always ready for the next event. Restarting the engine doesn't change which picos exist or what they know. Those three properties aren't conveniences bolted onto an actor system. They change what programming feels like.

The biggest change is that the database goes away. Most applications keep their state in a database and their behavior in a service, and developers spend a surprising amount of time translating between the two. In a pico, the state for an entity lives with the entity, next to the rules that use it. When a rule needs the last reading from a sensor, it reads an entity variable in the sensor's pico, because that's where the sensor's memory is. There's no schema to design up front and no connection pool to configure.

The second change is that the running system becomes visible. Programs, configuration files, and queries are static artifacts that create dynamic structures when they run, and good programmers carry a picture of those structures in their heads. The pico engine's developer UI shows that structure directly: the parent-child tree, the relationships between picos, the channels each one has, and the state each ruleset holds. You can raise an event on a running pico and watch what changes. The [1.8 release](https://www.windley.com/archives/2026/10/pico_engine_18_is_for_builders.shtml) pushes further in that direction, toward an inspector where every reference to another pico is a link you can follow.

<a href="/developing/_media/pico_mesh.png"><img src="/developing/_media/pico_mesh.png" alt="The developer UI showing the picos in my sensor network and their relationships" width="70%"></a>

The developer UI showing the picos in my sensor network and their relationships. Click the figure to enlarge it.

I know the objection. Images and stored procedures earned a bad reputation, because systems that lived only inside a running image were hard to version, hard to share, and hard to reproduce. Picos avoid the worst of that. Rulesets are source files loaded from URLs, so they live in git and get edited in whatever editor you like. Everything the UI does is available through an API, so a pico system can be built programmatically and rebuilt from nothing. The image is where the system lives, not where the code hides.

## One entity, one pico

The first habit to learn is to start with the nouns. Before you think about services, endpoints, or data, find the things in your problem that have identity and a lifetime: a person, a vehicle, a sensor, a course section, a household, an organization. Each of those gets a pico. The question to ask isn't "what service handles this?" but "who is this about?"

The things don't have to be smart. In 2013 I wrote about [potholes and picos](https://www.windley.com/archives/2013/04/pot_holes_and_picos.shtml). A pothole has no processor and no network connection, but it has a location, a history, and people who care about it: the driver who reported it, the city engineer who wants to see how it relates to the water lines underneath, and the crew that will fill it. Give the pothole a pico and it can remember its history, keep track of who reported it, and present a different view to each party it has a relationship with. Most things in the world will never be instrumented. They can still be on the internet.

The sensors in [my sensor network](https://www.windley.com/archives/2026/09/moving_my_sensor_network_onto_manifold.shtml) show the other case. They're tiny, battery-powered devices that wake up, send a few bytes over LoRaWAN, and go back to sleep. Each one has a pico that acts as its digital twin, doing the things the sensor is too low-powered (literally) to do: decoding payloads, keeping history, checking thresholds, and sending notifications. The sensor is the body; the pico is the memory and the judgment.

New developers usually worry that this means too many picos. It doesn't. Picos are cheap, and because they share nothing, they run concurrently without locks. When Bruce Conrad prototyped course registration at BYU, each course section was its own pico, and replaying a semester's registration events into thousands of section picos ran fine on a laptop. One pico holding a map of every section would have been a bottleneck and a single point of failure; many small picos split the problem along the lines the problem already has. A pico with a map of everything is usually a sign that some picos are missing.

## Events say what happened

Picos talk in two ways: events and queries. A query asks a pico for a value by calling a function the pico has chosen to share, and it has no side effects. An event tells a pico that something happened, and events are the only way a pico's state changes. That split is deliberate, and it's why the [event-query API](https://www.windley.com/archives/2013/12/pico_apis_events_and_queries.shtml) isn't REST. A pico's API isn't a fixed set of resources. It's whatever its installed rulesets listen for and share, and it changes as rulesets come and go. Sky is the current version of that API on this engine. See the [Event Exchange Protocol](/exp/).

The most important habit in pico programming is naming events as facts, not commands. An event says something happened: `sensor:new_readings`, `vehicle:trip_completed`, `community:thing_created`. A command says what someone wants done: `update_sensor`, `send_alert`, `process_trip`. The difference looks cosmetic, but it [changes the coupling](https://www.windley.com/archives/2011/02/eventbased_systems_and_selfdetermination.shtml). A command assumes the sender knows who will act and what they'll do. A fact assumes neither; the sender reports what it saw, and any rule that cares can respond. It works the way a cell releases a signal without knowing which other cells carry the receptor for it.

That leads to a principle I keep coming back to: rules have functionality; events do not. Whether anything happens when an event arrives depends on which rules are installed, what their event expressions select, what conditions they check, and what state the pico is in. The same event can do nothing in one pico and set off a cascade in another. This matters for anyone, human or agent, trying to understand a pico from the outside. If you want to know what a pico does, read its rules; its event names only tell you what it can hear.

A small example from the sensor network makes this concrete. A router ruleset decodes the sensor's payload and raises an event saying new readings arrived. It doesn't know or care what happens next:

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

A thresholds ruleset, written separately and installed later, listens for that event and decides whether the pump house is getting too cold:

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

Neither rule knows about the other. The router doesn't call the thresholds code, and the thresholds code doesn't care where the readings came from. A history ruleset, a plotting ruleset, or a ruleset that feeds Home Assistant can listen for the same event without changing either one. Naming facts buys you loose coupling.

## Let functionality accrete

Every pico has an internal event bus. When you install a ruleset, its rules start listening for the events they select on, and when you remove it, they stop. Nothing else has to change. Pico functionality accretes: you add capabilities to a pico by installing rulesets, layer on layer, rather than by editing a central dispatcher or redeploying a service. Each rule is, in effect, a tiny microservice for one entity. The [event loop](/developing/event-loop) is what one pico does with an event once it arrives.

Accretion has costs as well as benefits, and good pico programmers design for both. Rules from different rulesets may respond to the same event in an order you don't control, so each rule should do its job without depending on what another rule did first. Event expressions can help sort that out. Events can arrive more than once, so rules should be idempotent wherever possible; running them twice should leave the pico in the same state as running them once. When an action isn't naturally idempotent, a [guard rule](https://www.windley.com/archives/2014/07/idempotent_services_and_guard_rules.shtml) can check state first and decide whether to proceed. These aren't advanced techniques. They're the price of composing behavior from independent parts, and paying it is what lets a pico pick up new skills safely over a long life.

That long life is the other reason accretion matters. A vehicle's pico may outlive several owners, several apps, and several versions of every ruleset installed in it. Rulesets that migrate their own state when they're updated, and [rules that repair inconsistent state](https://www.windley.com/archives/2016/04/reactive_programming_patterns_examples_from_fuse.shtml) when they find it, let a pico system change incrementally while it runs. You don't redeploy a pico system so much as tend it.

A garden is a better picture of this than a building. Nobody redeploys a garden; you plant something new where there's room, graft a new variety onto rootstock that's already established, prune what has grown wrong, and amend the soil when something isn't thriving. Adding a pico is planting, installing a ruleset on an existing pico is grafting, and migration and repair rules are pruning and tending the soil. The garden keeps living between your visits, and every change you make is to something already alive. Most software is built like a house and torn down when it no longer fits. Pico systems grow and adapt.

## Asynchrony is the normal case

Picos don't wait. When one pico sends an event to another, it doesn't block for an answer; it goes on handling its own events, and any response arrives later as another event. This is the part of pico programming that trips up developers most, because most of us learned to write code where a call returns a value and the next line can use it.

The pico way is to make the conversation explicit. If a rule needs another pico to do something and wants to know when it's done, it sends the request along with a callback channel and a correlation id (`rcn`), stashes the context it will need under that id, and finishes the work in a separate rule that selects on the callback. [Manifold](https://github.com/Picolab/manifold-api) uses this pattern everywhere: an app asks Manifold to create a thing pico, passes its own callback channel and an `rcn`, and completes its setup when the `thing_created` event comes back. The tempting alternative is to schedule an event a few seconds out and hope the work is done by then. Hope isn't a coordination mechanism.

Errors are events too. A rule that fails can't throw an exception up a call stack, because there is no call stack between picos. Instead, rules raise error events that other rules can handle, retry, or report to the owner. Once you stop expecting answers on the next line, asynchrony stops feeling like a burden and starts looking like the way the world already works. My sensor doesn't wait for me to read its temperature, and when I drop my truck off at the shop, I don't stand at the counter until it's fixed; I leave a phone number, they give me a work order, and they call when it's ready.

## Rights are relationships

Every pico except a root pico has a parent. The parent-child tree is how picos are created, initialized, and administered; control of a root pico implies control of everything beneath it. But the tree isn't the application. Applications run on the graph of relationships between picos, and that graph is heterarchical: it crosses the tree, crosses meshes, and crosses engines. How to form one is in [Relationships](/wrangler/relationships).

We used to call these connections subscriptions, but the word was confusing. Developers heard RSS feeds, SaaS billing, or push notifications and built accordingly. What picos actually form is a relationship, and that is what we call them: pairwise, bidirectional, introduced by someone who already knows both sides, governed by policy, and long-lived. The name matches what I described in [Relationships in the Self-Sovereign Internet of Things](https://www.windley.com/archives/2020/12/relationships_in_the_self-sovereign_internet_of_things.shtml), where Alice's truck has relationships with its co-owners, a borrower, an insurer, and the DMV, each with its own rights.

The habit to learn is that rights belong to relationships, not to attributes. In a typical application, ownership is a column: the vehicle row has an owner id. In Fuse, ownership was a relationship between an owner pico and a fleet pico, so a fleet could have two owners simply by having two relationships, and a new owner could be added through an introduction from an existing one. Lending the truck to a friend is another relationship with fewer rights; revoking it means ending that relationship. This matches how we already think about these things in the physical world, where my neighbor's permission to borrow my truck is something between the two of us, not a field in someone's registry.

Channels make this concrete. A pico has as many channels as it needs, and each channel has a policy that says which events and queries are allowed to traverse it. Channel policies are the pico's receptors; like a cell membrane, a channel admits the signals it was built to recognize and ignores everything else. A channel identifier works like a capability: holding one lets you do what its policy allows and nothing more. A separate channel for each relationship or purpose means a webhook can raise only the one event it needs, a partner can't correlate your activity across relationships, and revoking one party's access doesn't disturb anyone else. If you find yourself checking a caller's identity inside a rule to decide what they're allowed to do, ask whether that decision belongs in a channel policy instead.

Relationships also depend on identity. A channel policy says what a caller may do, but when two picos on different engines form a relationship, each needs to know who is on the other end, and picos answer that question in three ways. A person unlocks their root pico with a [passkey](https://www.windley.com/archives/2026/07/identity_for_the_pico_engine.shtml#no-usernames-no-passwords), so the root pico is that person's actor on the mesh. Picos identify themselves to each other with [DIDs](https://www.windley.com/archives/2026/08/pico-to-pico_identity_arrives.shtml) (a `did:webvh` for each pico and a peer DID for each relationship), so strangers on different engines can establish trust by resolving each other's identifiers, with no central identity provider and no federation agreement. Outside software, like [Home Assistant](https://www.windley.com/archives/2026/08/using_home_assistant_with_manifold.shtml), reaches a mesh with [OAuth tokens](https://www.windley.com/archives/2026/07/identity_for_the_pico_engine.shtml#whole-mesh-apps-authorization-code) scoped to particular channels, so it gets access without becoming the pico. The habit to take from all this is that identity, like rights, lives in each pico and each relationship rather than in a directory someone else runs.

## Keep the bottom small

The pico stack is layered, and the layering is a design rule. The engine provides primitives: picos, channels, policy, persistence, and identity. [Wrangler](https://github.com/Picolab/pico-engine/blob/master/packages/pico-engine/krl/io.picolabs.wrangler.krl), the pico operating system, wraps those primitives in KRL so rulesets can create children, manage channels, and form relationships. Manifold is a framework that supplies a vocabulary for meshes of picos (owners, things, communities, and registries), and applications like the sensor network sit on top of Manifold.

The rule is that each layer stays ignorant of the ones above it. If a change to the engine or Wrangler needs the word "owner" or "thing," it belongs in Manifold. If a change to Manifold needs the word "sensor," it belongs in the sensor network. This takes discipline, because it's always easier to add a special case wherever you happen to be working. But every domain word that leaks downward makes the lower layers a little less general, and generality is the point. Picos can model a person, a truck, a beehive, or a pothole only because the engine doesn't know what any of those are.

The same restraint applies when the engine itself grows. When I need a new capability, my first question is whether it can be a ruleset rather than an engine change, and most of the time it can. Engine changes are commitments for everyone who runs a pico engine. Rulesets are choices individual picos make.

## Picos should be able to leave

Everything so far is about building good software. This part is about why I've kept at it for twenty years. Most of the internet is organized around services: you have an account with each company, your data lives in their systems, and your identity is whatever they say it is. Johannes Ernst described this in 2013 as the difference between [service-oriented and subject-oriented](https://upon2020.com/blog/2013/03/how-personal-clouds-are-different-subject-oriented-not-service-oriented/) clouds, and I've used that mental model ever since. In 2014 I called the result for connected devices [the CompuServe of Things](https://www.windley.com/archives/2014/04/the_compuserve_of_things.shtml): a world of silos where your thermostat works only as long as its manufacturer's cloud does.

Picos are subject-oriented. Each pico represents something (a person, a truck, a sensor, a pothole), but what a pico represents and who owns it are different questions. Ownership follows the tree: a pico belongs to whoever controls the root pico of the mesh it lives in, not to the vendor whose rulesets it runs or the company whose engine hosts it. My truck's pico represents the truck, but it lives in my mesh, under the root pico I unlock with my passkey, so it's mine. When I sell the truck, its pico can move to the buyer's mesh, history and all, and become theirs.

That ownership is real only if the pico can leave. Most people will never run a server, so their picos will live on someone else's engine, whether that's a community server, a cloud host, or a Raspberry Pi a family member keeps running. Freedom online means being able to move your picos from one host to another, taking their state, their rulesets, and their relationships with them, without asking anyone's permission.

That's why identity has been the focus of so much recent engine work. A pico's `did:webvh` identifier survives a move, and because its relationships are anchored in peer DIDs rather than in the host's addresses, they go with it. I've written about why [identity enables autonomy](https://www.windley.com/archives/2026/10/identity_enables_autonomy.shtml) and about [moving picos from mesh to mesh](https://www.windley.com/archives/2026/10/moving_picos_from_mesh_to_mesh.shtml), so I'll leave the details there. The mindset point is simpler: when you design a pico system, assume your picos will move. Don't store things that only make sense on one engine, don't hardcode another pico's location when you could hold a relationship to it, and don't build anything that only works if the host never changes.

## Picos and agents

Picos are actors, not agents, and I try to be careful about the distinction. But much of the current interest in AI agents is about things picos already provide. Something that acts for a person needs a durable identity, memory that belongs to its owner, a way to hear about events in the world, and limits on what it can do. A pico has all four. Its identity persists, its state is owned and isolated, its interface is events, and its channel policies bound what any caller, including a language model, can do.

The pattern I've been working toward is that the pico is the memory and the model is the reasoner. As I wrote in [AI Integration in Picos Starts with Events](https://www.windley.com/archives/2026/06/ai_integration_in_picos_starts_with_events.shtml), the integration starts with events: a pico raises an event, a model reasons about it, and the result comes back as another event that rules check before anything happens. The model proposes; the pico disposes. The engine's MCP server presents a pico's events and queries as tools, limited to the rulesets actually installed and the policy on the channel in use. A model can do only what the owner's picos allow. Connecting a remote client is [AI tools over MCP](/developing/mcp-ai-tools).

Coding agents are the other half of this. More and more pico code will be written with an agent's help, so the habits I described at the start matter as much for agents as for people. The repos now carry `CLAUDE.md` and `AGENTS.md` files that spell out the layering rule and the KRL conventions, and the schema work lets every ruleset describe itself. Conventions only go so far, though. An agent that understands why picos are shaped the way they are will write better KRL than one that has only memorized the syntax.

## Signs you're fighting the model

When a pico application feels harder than it should, some familiar habit has usually crept back in. These are the ones I see most often:

- One pico with a map of everything. If a pico holds a collection of entities that each have their own identity and history, those entities probably need their own pico.
- Events named like functions. `do_report` and `update_status` are commands. Fine names for rules, but not great names for events. Name the fact that happened and let rules decide what to do about it.
- Polling with queries. If you're asking a pico over and over whether something changed, have the pico raise an event when it does instead.
- Scheduling and hoping. A scheduled event that assumes other work has finished is a race. Use a callback with a correlation id.
- Permissions as attributes. An owner field or a role check inside a rule usually wants to be a relationship and a channel policy.
- Reaching for a database. State about an entity belongs in that entity's pico. External stores are for data that belongs to someone else.
- Domain words in lower layers. If the engine or Wrangler needs to know what a sensor is, the change is in the wrong place.
- Assuming the host never changes. Hardcoded URLs and engine-specific identifiers break the day a pico moves.

None of these will stop a program from running. They make it harder to change, harder to compose with other rulesets, and harder to move. Most of them come from the same place: treating a pico as a container for code rather than as the representative of something in the world.

## What it adds up to

A pico is a small, always-on computer that stands in for one thing in the world, remembers what has happened to it, listens for what happens next, and holds relationships with the other things it cares about. Programming picos well means modeling the world as it is: entities with identity and history, telling each other what happened, with rights that live in their relationships and a home they're free to leave. Get the model right and the KRL follows.

The habits on this page add up to something more than technique. Building with picos means respecting boundaries; a pico's state is its own, and you ask rather than reach in. It means saying what you know and leaving others free to act on it, rather than assuming you know who's listening or what they should do. It means patience with a system that answers in its own time and grows by accretion rather than by replacement. And it means restraint: keeping the bottom layers small, giving each part one job, and letting the whole emerge from parts that don't need to know about each other.

Underneath all of that is a question about who software is for. Every pico represents something, and that something belongs to someone: a person, a family, a small organization, a community. A pico that holds its owner's data, acts on its owner's behalf, keeps relationships on its owner's terms, and can pack up and move when its owner wants is software that serves the people it touches rather than administering or intermediating them. That's the internet I imagined when I picked the name: trillions of picos, each carrying out its own mission, connected by relationships rather than by accounts in someone else's system. That's an ecosystem, not an architecture, which is why building with picos calls for a gardener's mindset more than an architect's.

None of this changes because machines now write much of the code. The model still decides what the builder sees, whether the builder is a student writing a first ruleset or an agent generating a hundred of them. We can keep building systems where people and their things are records in someone else's database, or we can build systems where they have a place of their own online. Picos are my bet on the second, and the way of the pico is simply what that bet looks like when you sit down to build.

## Notes

The Scheme course used [*Essentials of Programming Languages*](http://www.amazon.com/exec/obidos/ASIN/0262062798/technometria-20) by Friedman and Wand, which taught models by having students build the operational semantics for them in Scheme.
