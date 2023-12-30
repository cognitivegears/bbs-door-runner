// Import required modules
const fs = require('fs');
const {V86} = require('../v86/libv86');
const _ = require('lodash');

class BbsDoorRunner {
	constructor({
		biosPath = '../v86/bios/seabios.bin',
		vgaBiosPath = '../v86/bios/vgabios.bin',
		bootDiskPath = '../v86/image/freedos722.img'} = {}) {
		this.biosPath = biosPath;
		this.vgaBiosPath = vgaBiosPath;
		this.bootDiskPath = bootDiskPath;
	}

	run() {
		// Define run logic here
	}

	runConsole() {
		// If we're already running, stop first
		this.stopConsole();

		// Check to make sure we are in a terminal
		if (!process.stdin.isTTY) {
			throw new Error('Not running in a terminal');
		}

		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		console.log('Now booting, please stand by...');

		const biosFile = this._readFile(this.biosPath);
		const fdaFile = this._readFile(this.bootDiskPath);

		this._consoleEmulator = new V86({
			bios: {buffer: biosFile},
			//			VgaBios: this._readFile(this.vgaBiosPath),
			fda: {buffer: fdaFile, async: true},
			//			Autostart: true,
			//			irq: this._irqHandler.bind(this),
			// This is the default value, but we set it explicitly to be sure
			//			memory_size: 16 * 1024 * 1024,
		});

		// Commented out for now, we need a workaround
		//		this._consoleEmulator.v86.cpu.devices.uart0.modem_status = (1 << 7);
		//		this._consoleEmulator.v86.cpu.devices.uart0.modem_status |= (0 << 6);
		//		this._consoleEmulator.v86.cpu.devices.uart0.modem_status |= (1 << 5);
		//		this._consoleEmulator.v86.cpu.devices.uart0.modem_status |= (1 << 4);
		// eslint-disable-next-line no-bitwise
		const modemStatus = (1 << 7) | (0 << 6) | (1 << 5) | (1 << 4);
		this._consoleEmulator.serial_set_modem_status(0, modemStatus);
		this._consoleEmulator.run();

		this._consoleEmulator.add_listener('serial0-output-byte', byte => 		{
			const chr = String.fromCharCode(byte);
			if (chr <= '~') {
				process.stdout.write(chr);
			}
		});

		process.stdin.on('data', c => 		{
			if (c === '\u0003') {
				// Ctrl c
				this.stopConsole();
				process.stdin.pause();
				console.log('Stopped.');
			} else {
				this._consoleEmulator.serial0_send(c);
			}
		});
	}

	stopConsole() {
		if (!(_.isNil(this._consoleEmulator))) {
			this._consoleEmulator.stop();
			this._consoleEmulator = null;
		}
	}

	_readFile(path) {
		return new Uint8Array(fs.readFileSync(__dirname + '/' + path)).buffer;
	}
}

// Export module
module.exports = BbsDoorRunner;
