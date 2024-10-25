// Import required modules
const fs = require("node:fs");
const path = require("node:path");
const fatfs = require("fatfs");
const { createBufferDriverSync } = require("fatfs-volume-driver");
const { V86 } = require("../v86/libv86");
const _ = require("lodash");

// Constant
const OUT_OF_BAND_PORT = 3;
const MAX_USER_PORT = 2;

/**
 * BBS Door Runner
 * @class
 * @classdesc BBS Door Runner
 * @param {object} options - Options
 * @param {string} options.biosPath - Path to the BIOS file
 * @param {string} options.vgaBiosPath - Path to the VGA BIOS file
 * @param {string} options.bootDiskPath - Path to the boot disk file
 * @param {string} options.hdaDiskPath - Path to the hard disk file
 * @example
 * const BbsDoorRunner = require('./BbsDoorRunner');
 * const doorRunner = new BbsDoorRunner({
 *   biosPath: '../v86/bios/seabios.bin',
 *   vgaBiosPath: '../v86/bios/vgabios.bin',
 *   bootDiskPath: '../v86/image/freedos722.img',
 *   hdaDiskPath: '../v86/image/hdd.img' });
 * doorRunner.start();
 * doorRunner.connect({
 *   port: 0,
 *   dropFileSrcPath: './dropfiles/door.sys',
 *   dropFileDestPath: 'C:\DOOR.SYS'
 * });
 */
class BbsDoorRunner {
	constructor({
		biosPath = "../v86/bios/seabios.bin",
		vgaBiosPath = "../v86/bios/vgabios.bin",
		bootDiskPath = "../v86/image/freedos722.img",
		hdaDiskPath,
	} = {}) {
		this.biosPath = biosPath;
		this.vgaBiosPath = vgaBiosPath;
		this.bootDiskPath = bootDiskPath;
		this.hdaDiskPath = hdaDiskPath;
		this.outputStreamList = new Array(4);
		this.exitStreamList = new Array(4);
	}

	/**
	 * Check if the emulator is running
	 * @returns {boolean} whether the emulator is running
	 */
	isRunning() {
		return !_.isNil(this._emulator);
	}

	/**
	 * Connect to the running emulator
	 * @param {object} options - Options
	 * @param {number} options.port - Port number (0-MAX_USER_PORT)
	 * @param {string} options.dropFileSrcPath - Path to the drop file
	 * @param {string} options.dropFileDestPath - Path to the drop file on the emulator
	 * @returns {object} pty - Pseudo terminal
	 * @throws {Error} if port is not provided or invalid or if the emulator is not running
	 * @example
	 * pty = doorRunner.connect({
	 *   port: 0,
	 *   dropFileSrcPath: './dropfiles/door.sys',
	 *   dropFileDestPath: 'C:\DOOR.SYS'
	 * });
	 */
	connect({ port, dropFileSrcPath, dropFileDestPath } = {}) {
		if (_.isNil(port)) {
			throw new Error("port is required");
		}

		if (!this.isRunning()) {
			throw new Error("Emulator is not running");
		}

		if (!_.isNumber(port) || port < 0 || port > MAX_USER_PORT) {
			throw new Error(
				`Invalid port number, must be between 0 and ${MAX_USER_PORT}`,
			);
		}

		this.writeDropFile(dropFileSrcPath, dropFileDestPath);

		this.setModemOptions(port);

		// Return a pty object that can be used to read and write to the emulator
		return {
			write: (c) => {
				const sendPort = port;
				this._emulator.serial_send(sendPort, c);
			},
			onData: (cb) => {
				const sendPort = port;
				this.outputStreamList[sendPort] = cb;
			},
			onExit: (cb) => {
				const sendPort = port;
				this.exitStreamList[sendPort] = cb;
			},
			resize() {},
			clear() {},
			kill() {
				const sendPort = port;
				this.disconnect(sendPort);
			},
			pause() {},
			resume() {},
		};
	}

	/**
	 * Disconnect a port from the emulator
	 * @param {number} port Port number (0-MAX_USER_PORT)
	 */
	disconnect(port) {
		if (_.isNil(port)) {
			throw new Error("port is required");
		}

		if (!_.isNumber(port) || port < 0 || port > MAX_USER_PORT) {
			throw new Error(
				`Invalid port number, must be between 0 and ${MAX_USER_PORT}`,
			);
		}

		// Set the carrier detect and others to false,
		// so that door games think they are disconnected
		this.setModemOptions(port, false);

		if (!_.isNil(this.inputStreamList[port])) {
			this.inputStreamList[port].removeListener(
				"data",
				this.inputStreamListener[port],
			);
			this.inputStreamList[port].removeListener(
				"end",
				this.inputStreamStopListener[port],
			);
			this.inputStreamList[port].removeListener(
				"close",
				this.inputStreamStopListener[port],
			);
		}

		// Clear streams
		this.outputStreamList[port] = null;
		this.exitStreamList[port] = null;
	}

	/**
	 * Get the maximum user port - available ports are 0 to MAX_USER_PORT
	 * @returns {number} Maximum user port
	 */
	getMaxUserPort() {
		return MAX_USER_PORT;
	}

	/**
	 * Get the out of band port, used internally for communications
	 * between the emulator and the runner
	 * @returns {number} Out of band port
	 */
	getOutOfBandPort() {
		return OUT_OF_BAND_PORT;
	}

	/**
	 * Set the modem options on the emulator so that door games
	 * think they are connected to a modem
	 * @param {number} port Port number (0-MAX_USER_PORT)
	 * @param {boolean} isOnline Whether the modem is online
	 */
	setModemOptions(port, isOnline = true) {
		this._emulator.serial_set_carrier_detect(port, isOnline);
		this._emulator.serial_set_clear_to_send(port, isOnline);
		this._emulator.serial_set_data_set_ready(port, isOnline);
		this._emulator.serial_set_ring_indicator(port, 0);
	}

	/**
	 * Write a drop file to the emulator
	 * @param {string} dropFileSrcPath Source path of the drop file
	 * @param {tring} dropFileDestPath Destination path of the drop file in the emulator
	 * @throws {Error} if hdaDiskPath is not defined
	 */
	writeDropFile(dropFileSrcPath, dropFileDestPath) {
		if (!_.isNil(dropFileSrcPath)) {
			if (_.isNil(this.hdaDiskPath)) {
				throw new Error("hdaDiskPath is required to add door files");
			}
			let destPath = dropFileDestPath;
			// Write dropfile to hda
			if (_.isNil(destPath)) {
				destPath = path.basename(dropFileSrcPath);
			}

			const dropFile = this._readFile(dropFileSrcPath);
			const volume = fatfs.createVolume(createBufferDriverSync(this.hdaFile));
			volume.writeFileSync(destPath, dropFile);
		}
	}

	/**
	 * Start the emulator
	 */
	start() {
		// If we're already running, stop first
		this.stop();

		const biosFile = this._readFile(this.biosPath);
		const fdaFile = this._readFile(this.bootDiskPath);
		let hdaFile;
		if (!_.isNil(this.hdaDiskPath)) {
			this.hdaFile = this._readFile(this.hdaDiskPath);
		}

		this._emulator = new V86({
			bios: { buffer: biosFile },
			fda: { buffer: fdaFile, async: true },
			hda: hdaFile ? { buffer: hdaFile, async: true } : undefined,
		});
		this._emulator.run();
		// Just add the listeners once and use the port number to determine which stream to write to
		for (let i = 0; i <= MAX_USER_PORT; i++) {
			this._emulator.add_listener(`serial${i}-output-byte`, (byte) => {
				const streamIndex = i;
				if (_.isNil(this.outputStreamList[streamIndex])) {
					return;
				}

				const chr = String.fromCharCode(byte);
				this.outputStreamList[streamIndex](chr);
			});
		}

		this._emulator.add_listener(`serial${OUT_OF_BAND_PORT}-output-byte`, () => {
			// For now, sending anything to the out-of-band port will cause the emulator to stop
			this.stop();
		});

		// Add a listener for emulator-stopped event
		this._emulator.add_listener("emulator-stopped", () => {
			// Stop all ports
			for (let i = 0; i < 4; i++) {
				this.disconnect(i);
			}

			// Clear emulator
			this.stop();
		});
	}

	/**
	 * Stop the emulator
	 */
	stop() {
		if (!_.isNil(this._emulator)) {
			this._emulator.stop();
			this._emulator = null;

			for (let i = 0; i <= MAX_USER_PORT; i++) {
				if (!_.isNil(this.exitStreamList[i])) {
					this.exitStreamList[i]({ exitCode: 0 });
				}
			}

			// Clear streams
			this.outputStreamList = new Array(4);
			this.exitStreamList = new Array(4);
		}
	}

	_readFile(path) {
		return new Uint8Array(fs.readFileSync(`${__dirname}/${path}`)).buffer;
	}
}

// Export module
module.exports = BbsDoorRunner;
