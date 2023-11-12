const {createDriverSync} = require('../src/volumeDriver/volumeDriverBuffer');

describe('createDriverSync', () => {
	let mockPath;
	let mockReadOnlyOpts;
	let mockReadWriteOpts;
	let mockBuffer;

	beforeEach(() => {
		mockPath = '';
		mockBuffer = Buffer.alloc(1024);
		mockReadOnlyOpts = {buffer: mockBuffer, readOnly: true};
		mockReadWriteOpts = {buffer: mockBuffer, readOnly: false};
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});
	it('should throw an error if the buffer length is unexpected in readSectors', () => {
		const driver = createDriverSync(mockPath, {readOnly: true, buffer: mockBuffer});
		const buffer = Buffer.alloc(513);

		expect(() => {
			driver.readSectors(0, buffer, () => {});
		}).toThrow('Unexpected buffer length!');
	});

	it('should honor the readOnly flag', () => {
		const driver = createDriverSync(mockPath, mockReadOnlyOpts);
		// Try to do a write and expect it to fail
		const buffer = Buffer.alloc(512);
		expect(() => {
			driver.readOnly.toBe(true);
		});

		expect(() => {
			driver.writeSectors(0, buffer, () => {});
		}).toThrow('Cannot write to read-only volume!');
	});

	it('should be able to call writeSectors when not in read-only mode', () => {
		const driver = createDriverSync(mockPath, mockReadWriteOpts);
		const buffer = Buffer.alloc(512);
		// Fill the buffer with a known value
		buffer.fill(1);

		const dest = Buffer.alloc(512);

		driver.writeSectors(0, buffer, () => {});
		driver.readSectors(0, dest, () => {});
		expect(() => {
			// Test that the dest buffer matches the original buffer
			expect(dest).toEqual(buffer);
		});
	});
});
