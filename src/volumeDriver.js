const _ = require('lodash');
const fs = require('fs');

class VolumeDriver {
	constructor(_path, opts = {}) {
		if (new.target === VolumeDriver) {
			throw new TypeError('Cannot construct VolumeDriver instances directly');
		}

		let fileMode = fs.constants.R_OK;
		if (!opts.readOnly) {
			// eslint-disable-next-line no-bitwise
			fileMode |= fs.constants.W_OK;
		}

		this._readOnly = opts.readOnly;

		this._fileMode = fileMode;
	}

	get partitionOffsetBytes() {
		return this._partitionOffsetBytes;
	}

	get partitionNumber() {
		return this._partitionNumber;
	}

	set partitionNumber(partitionNumber) {
		if (!_.isNumber(partitionNumber)) {
			throw new Error('Partition number must be a number!');
		}

		if (partitionNumber === 0) {
			this._partitionNumber = 0;
			this._partitionOffsetBytes = 0;
			return;
		}

		if (partitionNumber < 1 || partitionNumber > this._partitionLBAList.length) {
			throw new Error('Partition ' + partitionNumber + ' does not exist!');
		}

		this._partitionNumber = partitionNumber;
		this._partitionOffsetBytes = this._partitionLBAList[this._partitionNumber - 1] * this.sectorSize;
	}

	get readOnly() {
		return this._readOnly;
	}

	checkSectorLength(dest) {
		if (dest.length % this.sectorSize) {
			throw Error('Unexpected buffer length!');
		}
	}

	readSectors(_i, _dest, _cb) {
		throw new Error('Abstract method \'readSectors\' must be implemented');
	}

	writeSectors(_i, _data, _cb) {
		throw new Error('Abstract method \'writeSectors\' must be implemented');
	}

	parsePartitionsFromBuffer(buffer) {
		const partitionOffsets = [];
		for (let i = 446; i < 510; i += 16) {
			partitionOffsets.push(buffer.readInt32LE(i + 8));
		}

		return partitionOffsets;
	}

	readPartitions() {
		throw new Error('Abstract method \'readPartitions\' must be implemented');
	}

	get sectorSize() {
		return 512;
	}

	get numSectors() {
		throw new Error('Abstract method \'numSectors\' must be implemented');
	}
}

module.exports = VolumeDriver;
