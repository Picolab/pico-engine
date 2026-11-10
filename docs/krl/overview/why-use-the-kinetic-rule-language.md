# Why Use the Kinetic Rule Language?

A natural question is, "Why a new programming language?" KRL is an internet-aware programming language designed specifically for building applications that respond to events on behalf of individuals. Before I deal with the "new programming language" question, let's handle a more basic one: why a programming language at all? Why not just build a menu-based user interface that allows people to configure the actions the system takes in response to certain event scenarios?

User interfaces are inherently limiting because they provide a fixed menu of choices and little opportunity to combine features from one submenu with another. The whole idea of a menu is to limit choices in order to gain simplicity. In contrast, languages are combinatorial in their expressiveness. Good programming languages have orthogonality, which means that features are independent and thus can be combined together in ways that open up a geometric explosion of possible outcomes. This gives programming language nearly unlimited expressive power. In my career, I've built dozens of user interfaces (UIs) and several programming languages. No one has ever surprised me with what they accomplished with a UI, but I'm constantly amazed at what people achieve with languages.

I believe that languages promote "creative laziness," to borrow a phrase from [Douglas Crockford](http://www.slideshare.net/douglascrockford/gluecon). By creating a domain-specific notation, we encourage programmers to be lazy in ways that save effort and enhance effectiveness. Moreover, notations mold the thought patterns of programmers. Anyone who experienced a wildly different language from the ones they're familiar with such as Erlang or Lisp knows that you have to change the way you think to effectively use such a language. This is often a feature rather than a bug.

Current Web-programming languages are optimized for the dynamic query, static data (DQSD) problems of traditional Web sites. PHP, for example, was specifically designed for building interactive Web sites that depended on a database for their operation. Later, Ruby on Rails came along and improved on that model. In contrast, KRL is optimized for dynamic data, static query (DDSQ) problems and the event model of the live Web.

In addition to handling events well, any programming language for the live Web must also manage and manipulate entity context effectively. Identity and the methods for linking identities must be built into our tools and frameworks. A language that provides intrinsic identity for entities can abstract away much of the overhead that current online identity solutions require. Programmers spend far too much time managing identities and often do it poorly due to the limited expressive power most languages have for dealing with this particular problem domain. KRL has the notion of "entity" built-in from the ground up, and the rule engine architecture supports that abstraction.

Why did programmers adopt Ruby when its functionally equivalent to existing languages? Why did Rails become popular when it's just written in Ruby? New languages become popular because they solve current problems in a better, more efficient way than existing languages and platforms.

KRL is a new language because developers were frustrated trying to solve evented problems with tools ill suited to the task. KRL is specifically built to program systems that react to events in the live Web. Using KRL, a programmer can construct intelligent filters that look for complex patterns in multiple event streams and prompt further action.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189857) (last edited there 2017-07-17).</small>
