const VolumeDriver = require('../src/volumeDriver');

describe('createDriverSync', () => {
	beforeEach(() => {
	});

	afterEach(() => {
	});

	it('should throw an error when volumeDriver is instantiated directly', () => {
		expect(() => {
			// eslint-disable-next-line no-new
			new VolumeDriver();
		}).toThrow('Cannot construct VolumeDriver instances directly');
	});

	it('should throw an error on base class if readSectors isnt implemented', () => {
		// Make a subclass that doesn't implement readSectors
		class MyDriver extends VolumeDriver {
		}
		const myDriver = new MyDriver();
		expect(() => {
			myDriver.readSectors(0, Buffer.alloc(512), () => {});
		}).toThrow('Abstract method \'readSectors\' must be implemented');
	});

	it('should throw an error on base class if writeSectors isnt implemented', () => {
		// Make a subclass that doesn't implement writeSectors
		class MyDriver extends VolumeDriver {
		}
		const myDriver = new MyDriver();
		expect(() => {
			myDriver.writeSectors(0, Buffer.alloc(512), () => {});
		}).toThrow('Abstract method \'writeSectors\' must be implemented');
	});

	it('should throw an error on base class if readPartitions isnt implemented', () => {
		// Make a subclass that doesn't implement readPartitions
		class MyDriver extends VolumeDriver {
		}
		const myDriver = new MyDriver();
		expect(() => {
			myDriver.readPartitions();
		}).toThrow('Abstract method \'readPartitions\' must be implemented');
	});

	it('should throw an error on base class if numSectors isnt implemented', () => {
		// Make a subclass that doesn't implement numSectors
		class MyDriver extends VolumeDriver {
		}
		const myDriver = new MyDriver();
		expect(() => {
			myDriver.numSectors();
		}).toThrow('Abstract method \'numSectors\' must be implemented');
	});
});
