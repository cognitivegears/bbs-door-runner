# bbs-door-runner

## Overview

`bbs-door-runner` is a Node.js library designed to run BBS Door games using the `v86` library for 8086 emulation. Typically one of the harder things to do when setting a retro BBS system is getting Door games to run. When running a BBS under a modern system, an emulator is needed to run most x86 door games, and the configuration can be tough to do and maintain. This library aims to ease the setup of these games by encapsulating both the emulation and filesystem needs within a single library that can be included from any Node.js project. This library was initially designed for [Enigma ½ BBS](https://enigma-bbs.github.io/) but should be usable by other systems as well.

## Installation

Install the package via npm:

```bash
npm install bbs-door-runner
```

## Usage

Here's a simple example to get you started:

```javascript
const BbsDoorRunner = require('bbs-door-runner');

const options = {
  biosPath: '../v86/bios/seabios.bin', // usually just leave default
  vgaBiosPath: '../v86/bios/vgabios.bin', // usually just leave default
  bootDiskPath: '../v86/image/freedos722.img', // usually just leave default
  hdaDiskPath: '../v86/image/hdd.img' // path to hard disk image with door
};

const bbsDoorRunner = new BbsDoorRunner(options);

bbsDoorRunner.run();


// Then to connect:

doorRunner.connect({
  port: 0, // 0-3
  inputStream: process.stdin, // any Readable Stream
  outputStream: process.stdout, // any Writeable Stream
  dropFileSrcPath: './dropfiles/door.sys', // Where the dropfile was placed
  dropFileDestPath: 'C:\DOOR.SYS' // Where to put it on the image
});

// To stop the door:
bbsDoorRunner.stop();

```

## Contributing

We welcome contributions! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to contribute to the development of `bbs-door-runner`.

## License

This project is licensed under the BSD 2-clause license. See the [LICENSE](LICENSE) file for details.
