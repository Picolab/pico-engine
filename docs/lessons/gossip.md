# Gossip Lab

The Gossip Lab is an optional, advanced exercise. It was the ninth lab (Lab 9) in BYU CS 462, the course that uses picos to teach reactive, event-based programming. The Pico Programming Lessons list it last, and it isn't part of the main sequence.

## What's here, and what isn't

The original wiki page is almost empty. It holds one thing: a video recorded for the Lab 9 assignment. You can watch it on YouTube: [Gossip Lab video](https://www.youtube.com/watch?v=WrBf9kg-_ZY).

This engine's documentation doesn't reproduce the assignment. The wiki page doesn't contain it (students got the assignment through the course), and rather than guess at the protocol, this page stops here. If you're taking the course, use the assignment text from your instructor.

## Preparing for it

Whatever the details of the assignment, a gossip-style system of picos uses things these lessons teach. If you want to be ready, work through:

- [Pico-Based Systems](/lessons/pico-based-systems): create a set of picos and keep track of them
- [Relationships](/lessons/relationships): link picos that aren't parent and child, and send events over the link
- [Scatter-Gather](/lessons/scatter-gather): send events to many picos without waiting, correlate the answers, and deal with lost events
- [Pico State](/lessons/pico-state): keep and update persistent state

In the cookbook, [Two picos talking](/cookbook/two_picos/) and [Collection](/cookbook/collection/) are small runnable examples of picos with relationships. Picos communicate only by events and queries, so any distributed protocol on picos is built from those, plus a channel policy for what each peer may do.

## Back to the lessons

The main sequence starts at the [Quickstart](/lessons/quickstart).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/727384069) (Gossip Lab, last edited there 2019-03-29). The wiki page holds only a video.</small>
