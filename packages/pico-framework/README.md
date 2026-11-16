# pico-framework

[![Build Status](https://github.com/Picolab/pico-framework/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/Picolab/pico-framework/actions/workflows/test.yml)

A framework for building actor-based, people-centric systems. (pico = PersIstent Compute Objects)

## Why Picos?

An excellent explanation is [here](http://www.windley.com/archives/2015/05/picos_persistent_compute_objects.shtml).

## What the PicoFramework does

It handles the building blocks of a Pico based system.

- Picos
  - Parent / Child relationships
  - Channels
    - Events
    - Queries
    - Policies for them
  - Rulesets
  - What the ruleset code is allowed to do to a pico i.e. sandboxing

The pico-framework also handles persistence of the pico objects. You simply provide the persistence layer via an implementation of [abstract-level](https://github.com/Level/abstract-level).

## Contributing

Be sure to run the tests before checking in changes.

```sh
npm test
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md). **0.8.1** adds optional custom channel id at creation and `PicoFramework.eciIsTaken()`.

## License

MIT
