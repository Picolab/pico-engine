# pico-engine

[![Node version](https://img.shields.io/node/v/pico-engine.svg)](https://nodejs.org/en/download/)

An implementation of the [pico-engine](http://www.windley.com/archives/2016/03/rebuilding_krl.shtml) hosted on node.js

## Getting Started

### Installing

You'll need [node.js](https://nodejs.org/) LTS or Current (we recommend LTS).

- Windows - use the installer at [nodejs.org](https://nodejs.org/en/download/)
- Mac - use the installer at [nodejs.org](https://nodejs.org/en/download/) or use [n bash script](https://github.com/tj/n) (n makes it easy to switch between node versions)
- Linux - we recommend the [n bash script](https://github.com/tj/n) which will allow you to easily install and switch between node versions.

Once you have node installed, use npm to install the `pico-engine`;

```sh
$ npm install -g pico-engine
```

Now your system has a new command called `pico-engine`.

To start the engine simply run this command

```sh
$ pico-engine
```

Visit the url `http://localhost:3000` in a browser to use the developer UI (described below).

#### Troubleshooting

###### If install fails and you see `gyp ERR! ...` in the output:

pico-engine uses [leveldb](http://leveldb.org) to store data. It's a C++ library which is prebuilt for most systems. However, if the prebuilt binary is not available for your combination of operating system and node.js version, npm will compile it for you using [node-gyp](https://github.com/nodejs/node-gyp#installation). However, `node-gyp` assumes your system will have python 2 and a c++ compiler available.

**Windows**

Open command prompt as Administrator then run `npm install --global --production windows-build-tools` That will configure python and c++ compiler for npm.

We have had reports that the `pico-engine` command stops working with earlier versions of `node.js`, so update to the latest version.

**Mac / Linux**

Be sure you have python 2.7 installed. If python 3 is the system default, all you need to do is configure npm to use python 2.7 like so `npm config set python /path/to/executable/python2.7`

To setup C++

```sh
# Mac
xcode-select --install
# Ubuntu
sudo apt-get install build-essential
# AWS Linux
sudo yum groupinstall "Development Tools"
```

For more help, see [node-gyp](https://github.com/nodejs/node-gyp#installation).

##### Folder problems

When you run the `npm install` command, if you are in a folder which contains a folder named `pico-engine`, the command can fail in various ways.
Otherwise it doesn't matter which folder you are in, since you are doing a global install.

##### If these steps don't help

Open an [issue](https://github.com/picolab/pico-engine/issues/new) and tag @farskipper. Please include your operating system, node.js version (`node -v`), and a copy of the error output.

### Bootstrap

The first time you run the system it will create a root Pico with three rulesets installed.

There are three rulesets used by all Picos:

- `io.picolabs.wrangler` is used by each Pico to keep track of itself and its children
- `io.picolabs.pico-engine-ui` is used by each Pico to keep track of its rectangle in the developer UI
- `io.picolabs.subscription` is used by each Pico to keep track of its subscriptions to other picos

### Using the developer UI

With the rulesets installed, you can drag the rectangle representing your Pico and drop it
wherever you want it. In its "About" tab (click on it to reveal the tabs) you can change its
display name and color.

Also in the "About" tab, you can add and delete child Picos.

In the "Rulesets" tab you can see the rulesets installed in your Pico.
By clicking on a ruleset id,
you will see the location of its source code.

To make your own ruleset, use an editor to write its KRL code.
Enter the URL of that file in the "Rulesets" tab and click on the "Install" button.

### Updating/downgrading

Heads up! Especially when downgrading there may be a risk of data loss. It's recommended you backup your pico-engine home folder first. By default the folder is located `~/.pico-engine/` it contains your database.

```sh
# to view your current version
$ pico-engine --version

# to view what npm has installed globally, including current version
$ npm ls -g --depth 0 pico-engine

# to view available versions
$ npm view pico-engine versions

# to install a specific version i.e. `0.41.0`
$ npm install -g pico-engine@0.41.0
```

## CLI

### Configuration

The server is configured via some environment variables.

- `PORT` - The port the http server should listen on. By default it's `3000`
- `PICO_ENGINE_HOME` - Where the database and other files should be stored. By default it's `~/.pico-engine/`
- `PICO_ENGINE_BASE_URL` - The public url prefix to reach this engine. By default it's `"http://localhost:3000"`

The `PORT` is the only value used in setting up the engine’s [nodejs http server](https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback). We only specify the `port` so it listens listens to all traffic on that port, it will not filter by host.

For example, say you want to have your engine running with SSL on a custom domain i.e. `https://example.com` Starting the engine like this `PICO_ENGINE_BASE_URL=https://example.com pico-engine` is not enough. You will need to use a reverse proxy server like nginx to handle the SSL termination, and then forward the traffic to your private port that is running the engine.

## Contributing

See the repository [root readme](https://github.com/Picolab/pico-engine#readme)

## Changelog

To view details about versions: [CHANGELOG.md](https://github.com/Picolab/pico-engine/blob/master/CHANGELOG.md)

## License

MIT
