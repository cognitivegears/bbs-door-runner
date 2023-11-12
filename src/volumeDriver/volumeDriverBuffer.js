const _ = require('lodash');
const VolumeDriver = require('../volumeDriver');

class VolumeDriverBuffer extends VolumeDriver {
	constructor(path, opts = {}) {
		super(path, opts);

		if (opts.buffer === undefined) {
			throw new Error('Buffer does not exist!');
		}

		// Make sure opts.buffer is a Buffer
		if (!Buffer.isBuffer(opts.buffer)) {
			throw new Error('buffer option is not a Buffer!');
		}

		this._buffer = opts.buffer;

		const partitionNumber = _.isNumber(opts.partitionNumber) ? opts.partitionNumber : 0;

		if (partitionNumber !== 0) {
			this._partitionLBAList = this.readPartitions();
		}

		this.partitionNumber = partitionNumber;
	}

	readSectors(i, dest, cb) {
		this.checkSectorLength(dest);

		const data = this._buffer.slice(this._partitionOffsetBytes + (i * this.sectorSize), this._partitionOffsetBytes + ((i + 1) * this.sectorSize));
		dest.set(data);
		cb(null, data);
	}

	writeSectors(i, data, cb) {
		if (this.readOnly) {
			throw new Error('Cannot write to read-only volume!');
		}

		this.checkSectorLength(data);

		// Copy the data Buffer into the correct location in the buffer
		data.copy(this._buffer, this._partitionOffsetBytes + (i * this.sectorSize), 0, data.length);
		cb(null);
	}

	readPartitions() {
		// Check to make sure that the buffer length is at least 512 bytes
		if (this._buffer.length < 512) {
			return [];
		}

		const mbrBuffer = Buffer.alloc(512);

		// Copy the first 512 bytes of the buffer into mbrBuffer
		this._buffer.copy(mbrBuffer, 0, 0, 512);

		return this.parsePartitionsFromBuffer(mbrBuffer);
	}

	get numSectors() {
		// Return the buffer size devided by the sector size
		return this._buffer.length / this.sectorSize;
	}
}

exports.createDriverSync = function (path, opts = {}) {
	return new VolumeDriverBuffer(path, opts);
};
