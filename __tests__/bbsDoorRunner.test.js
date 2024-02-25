const BbsDoorRunner = require('../src/BbsDoorRunner');

/* Add const {Readable} = require('stream'); */

describe('BbsDoorRunner', () => {
	test('should be a class', () => {
		expect(typeof BbsDoorRunner).toBe('function');
	});

	test('should have a constructor method', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(typeof bbsDoorRunner.constructor).toBe('function');
	});

	test('should have a start method', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(typeof bbsDoorRunner.start).toBe('function');
	});

	test('should have a connect method', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(typeof bbsDoorRunner.connect).toBe('function');
	});

	test('should have a disconnect method', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(typeof bbsDoorRunner.disconnect).toBe('function');
	});

	test('should have a isRunning method', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(typeof bbsDoorRunner.isRunning).toBe('function');
	});

	test('should have a stop method', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(typeof bbsDoorRunner.stop).toBe('function');
	});

	test('isRunning should return the emulator status', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		bbsDoorRunner.start();
		expect(bbsDoorRunner.isRunning()).toBe(true);
		bbsDoorRunner.stop();
		expect(bbsDoorRunner.isRunning()).toBe(false);
	});

	test('connect should throw an error if the emulator is not running', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(() => bbsDoorRunner.connect({port: 0, inputStream: {}, outputStream: {}})).toThrow('Emulator is not running');
	});

	test('connect should throw an error if parameter is not provided', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		bbsDoorRunner.start();
		expect(() => bbsDoorRunner.connect({})).toThrow('port is required');
		bbsDoorRunner.stop();
	});

	test('connect should throw an error if port is not valid', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		bbsDoorRunner.start();
		expect(() => bbsDoorRunner.connect({port: -1})).toThrow('Invalid port number, must be between 0 and 3');
		expect(() => bbsDoorRunner.connect({port: 4})).toThrow('Invalid port number, must be between 0 and 3');
		expect(() => bbsDoorRunner.connect({port: 'a'})).toThrow('Invalid port number, must be between 0 and 3');
		bbsDoorRunner.stop();
	});

	test('disconnect should throw an error if port is invalid', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(() => bbsDoorRunner.disconnect(null)).toThrow('port is required');
	});

	test('disconnect should throw an error if port is not valid', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(() => bbsDoorRunner.disconnect(-1)).toThrow('Invalid port number, must be between 0 and 3');
		expect(() => bbsDoorRunner.disconnect(4)).toThrow('Invalid port number, must be between 0 and 3');
		expect(() => bbsDoorRunner.disconnect('a')).toThrow('Invalid port number, must be between 0 and 3');
	});
});
