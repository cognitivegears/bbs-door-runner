const _ = require('lodash');
const fs = require('fs');

class VolumeDriver {
	constructor(path, opts = {}) {
		const _ = require('lodash');

		if (!fs.existsSync(path)) {
			throw new Error('File does not exist!');
		}

		let fileMode = fs.constants.R_OK;
		if (!opts.readOnly) {
			// eslint-disable-next-line no-bitwise
			fileMode |= fs.constants.W_OK;
		}

		this._readOnly = opts.readOnly;

		this._fileMode = fileMode;

		this._fd = fs.openSync(path, opts.readOnly ? 'r' : 'r+');
		this._s = fs.fstatSync(this._fd);

		const partitionNumber = _.isNumber(opts.partitionNumber) ? opts.partitionNumber : 0;

		if (partitionNumber !== 0) {
			this._partitionLBAList = this.readPartitions();
		}

		this.partitionNumber = partitionNumber;
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

	readSectors(i, dest, cb) {
		if (dest.length % this.sectorSize) {
			throw Error('Unexpected buffer length!');
		}

		fs.read(this._fd, dest, 0, dest.length, this._partitionOffsetBytes + (i * this.sectorSize), (e, n, d) => {
			cb(e, d);
		});
	}

	writeSectors(i, data, cb) {
		const fs = require('fs');
		if (data.length % this.sectorSize) {
			throw Error('Unexpected buffer length!');
		}

		fs.write(this._fd, data, 0, data.length, this._partitionOffsetBytes + (i * this.sectorSize), e => {
			cb(e);
		});
	}

	readPartitions() {
		const fs = require('fs');
		if (this._s.size < 512) {
			return [];
		}

		const mbrBuffer = Buffer.alloc(512);
		fs.readSync(this._fd, mbrBuffer, 0, 512, 0);

		const partitionOffsets = [];
		for (let i = 446; i < 510; i += 16) {
			partitionOffsets.push(mbrBuffer.readBigInt32LE(i + 8));
		}

		return partitionOffsets;
	}

	get sectorSize() {
		return 512;
	}

	get numSectors() {
		return this._s.size / this.sectorSize;
	}
}

exports.createDriverSync = function (path, opts = {}) {
	return new VolumeDriver(path, opts);
};
