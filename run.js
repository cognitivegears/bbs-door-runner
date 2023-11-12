const fs = require('fs');
const fatfs = require('fatfs');
const {createDriverSync} = require('./src/volumeDriver/volumeDriverBuffer');

// Read the file v86/image/freedos20mb.img into a Buffer
const buffer = fs.readFileSync('v86/image/freedos20mb.img');

// Const driver = createDriverSync('v86/image/freedos20mb.img', {partitionNumber: 1, readOnly: true});

const driver = createDriverSync('', {buffer, partitionNumber: 1, readOnly: true});
const fsf = fatfs.createFileSystem(driver);
fsf.stat('startup.bat', (e, stats) => {
	if (e) {
		console.error(e);
	} else {
		console.log(stats);
	}
});

fsf.readFile('startup.bat', (err, contents) => {
	if (err) {
		contents.error(err);
	}

	console.log(contents.toString());
});
