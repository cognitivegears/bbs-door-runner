const BbsDoorRunner = require('../index');

describe('BbsDoorRunner', () => {
	test('should be a class', () => {
		expect(typeof BbsDoorRunner).toBe('function');
	});

	test('should have a constructor method', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(typeof bbsDoorRunner.constructor).toBe('function');
	});

	test('should have a run method', () => {
		const bbsDoorRunner = new BbsDoorRunner({});
		expect(typeof bbsDoorRunner.run).toBe('function');
	});
});
