const fs = require('fs');
const _ = require('lodash');
const VolumeDriver = require('../volumeDriver');

class VolumeDriverFile extends VolumeDriver {
	constructor(path, opts = {}) {
		super(path, opts);

		if (!fs.existsSync(path)) {
			throw new Error('File does not exist!');
		}

		this._fd = fs.openSync(path, opts.readOnly ? 'r' : 'r+');
		this._s = fs.fstatSync(this._fd);

		const partitionNumber = _.isNumber(opts.partitionNumber) ? opts.partitionNumber : 0;

		if (partitionNumber !== 0) {
			this._partitionLBAList = this.readPartitions();
		}

		this.partitionNumber = partitionNumber;
	}

	readSectors(i, dest, cb) {
		this.checkSectorLength(dest);

		fs.read(this._fd, dest, 0, dest.length, this._partitionOffsetBytes + (i * this.sectorSize), (e, n, d) => {
			cb(e, d);
		});
	}

	writeSectors(i, data, cb) {
		this.checkSectorLength(data);

		fs.write(this._fd, data, 0, data.length, this._partitionOffsetBytes + (i * this.sectorSize), e => {
			cb(e);
		});
	}

	readPartitions() {
		if (this._s.size < 512) {
			return [];
		}

		const mbrBuffer = Buffer.alloc(512);
		fs.readSync(this._fd, mbrBuffer, 0, 512, 0);

		return this.parsePartitionsFromBuffer(mbrBuffer);
	}

	get numSectors() {
		return this._s.size / this.sectorSize;
	}
}

exports.createDriverSync = function (path, opts = {}) {
	return new VolumeDriverFile(path, opts);
};
