// __tests__/integration/fileUtils.spec.js

const fs = require('fs');
const path = require('path');
const fatfs = require('fatfs');
const {extractZipToFatfs} = require('../../src/fileUtils');
const {createDriverSync} = require('../../src/volumeDriver/volumeDriverBuffer');

describe('fileUtils integration test', () => {
	beforeEach(() => {
	});

	afterEach(() => {
	});

	test('should extract files from the zip and validate with VolumeDriver buffer', async () => {
		// Use the fs module to read v86/image/freedos20mb.img
		const imgpath = path.join(__dirname, '../../', 'v86', 'image', 'freedos20mb.img');

		// Read the fatfsPath into a Buffer
		const buffer = fs.readFileSync(imgpath);
		const driver = createDriverSync('', {buffer, partitionNumber: 1, readOnly: false});
		const fsf = fatfs.createFileSystem(driver);

		const zipfile = path.join(__dirname, '../resources', 'simpletest.zip');

		await extractZipToFatfs(zipfile, fsf);

		// Use VolumeDriver to validate the extracted files
		const readFilePromise = new Promise((resolve, reject) => {
			fsf.readFile('a.txt', (err, contents) => {
				if (err) {
					reject(err);
				} else {
					resolve(contents);
				}
			});
		});

		const fileContent = await readFilePromise;

		// Verify the extracted file contents
		expect(fileContent.toString()).toEqual('THIS IS FILE A\n');

		const readFilePromiseB = new Promise((resolve, reject) => {
			fsf.readFile('b.txt', (err, contents) => {
				if (err) {
					reject(err);
				} else {
					resolve(contents);
				}
			});
		});

		const fileContentB = await readFilePromiseB;

		// Verify the extracted file contents
		expect(fileContentB.toString()).toEqual('THIS IS FILE B\n');
	});
});
