// Import required modules
const fs = require('fs');
const path = require('path');
const fatfs = require('fatfs');
const {createBufferDriverSync} = require('fatfs-volume-driver');
const {V86} = require('../v86/libv86');
const _ = require('lodash');

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
 *   inputStream: process.stdin,
 *   outputStream: process.stdout,
 *   dropFileSrcPath: './dropfiles/door.sys',
 *   dropFileDestPath: 'C:\DOOR.SYS'
 * });
 */
class BbsDoorRunner {
	constructor({
		biosPath = '../v86/bios/seabios.bin',
		vgaBiosPath = '../v86/bios/vgabios.bin',
		bootDiskPath = '../v86/image/freedos722.img',
		hdaDiskPath} = {}) {
		this.biosPath = biosPath;
		this.vgaBiosPath = vgaBiosPath;
		this.bootDiskPath = bootDiskPath;
		this.hdaDiskPath = hdaDiskPath;
		this.inputStreamList = new Array(4);
		this.outputStreamList = new Array(4);
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
	 * @param {number} options.port - Port number (0-3)
	 * @param {object} options.inputStream - Input stream
	 * @param {object} options.outputStream - Output stream
	 * @param {string} options.dropFileSrcPath - Path to the drop file
	 * @param {string} options.dropFileDestPath - Path to the drop file on the emulator
	 * @throws {Error} if port is not provided or invalid, inputStream, or outputStream are not provided, or if the emulator is not running
	 */
	connect({port, inputStream, outputStream, dropFileSrcPath, dropFileDestPath} = {}) {
		if (_.isNil(port) || _.isNil(inputStream) || _.isNil(outputStream)) {
			throw new Error('port, inputStream, and outputStream are required');
		}

		if (!this.isRunning()) {
			throw new Error('Emulator is not running');
		}

		if (isNaN(port) || port < 0 || port > 3) {
			throw new Error('Invalid port number, must be between 0 and 3');
		}

		this.writeDropFile(dropFileSrcPath, dropFileDestPath);

		this.setModemOptions(port);

		this.inputStreamList[port] = inputStream;
		this.outputStreamList[port] = outputStream;

		this.inputStreamListener[port] = c => {
			const sendPort = port;
			this._emulator.serial_send(sendPort, c);
		};

		inputStream.on('data', this.inputStreamListener[port]);
	}

	/**
	 * Disconnect a port from the emulator
	 * @param {number} port Port number (0-3)
	 */
	disconnect(port) {
		if (_.isNil(port)) {
			throw new Error('port is required');
		}

		if (isNaN(port) || port < 0 || port > 3) {
			throw new Error('Invalid port number, must be between 0 and 3');
		}

		if (!_.isNil(this.inputStreamList[port])) {
			this.inputStreamList[port].removeListener('data', this.inputStreamListener[port]);
		}

		this.inputStreamList[port] = null;
		this.outputStreamList[port] = null;
	}

	/**
	 * Set the modem options on the emulator so that door games
	 * think they are connected to a modem
	 * @param {number} port Port number (0-3)
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
				throw new Error('hdaDiskPath is required to add door files');
			}

			// Write dropfile to hda
			if (_.isNil(dropFileDestPath)) {
				dropFileDestPath = path.basename(dropFileSrcPath);
			}

			const dropFile = this._readFile(dropFileSrcPath);
			const volume = fatfs.createVolume(createBufferDriverSync(this.hdaFile));
			volume.writeFileSync(dropFileDestPath, dropFile);
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
			bios: {buffer: biosFile},
			fda: {buffer: fdaFile, async: true},
			hda: hdaFile ? {buffer: hdaFile, async: true} : undefined,
		});
		this._emulator.run();
		// Just add the listeners once and use the port number to determine which stream to write to
		for (let i = 0; i < 4; i++) {
			this._emulator.add_listener('serial' + i + '-output-byte', byte => {
				const streamIndex = i;
				if (_.isNil(this.outputStreamList[streamIndex])) {
					return;
				}

				const chr = String.fromCharCode(byte);
				this.outputStreamList[streamIndex].write(chr);
			});
		}
	}

	/**
	 * Stop the emulator
	 */
	stop() {
		if (!(_.isNil(this._emulator))) {
			this._emulator.stop();
			this._emulator = null;

			// Remove listeners
			for (let i = 0; i < 4; i++) {
				if (!_.isNil(this.inputStreamList[i])) {
					this.inputStreamList[i].removeListener('data', this.inputStreamListener[i]);
				}
			}

			// Clear streams
			this.inputStreamList = new Array(4);
			this.outputStreamList = new Array(4);
		}
	}

	_readFile(path) {
		return new Uint8Array(fs.readFileSync(__dirname + '/' + path)).buffer;
	}
}

// Export module
module.exports = BbsDoorRunner;
