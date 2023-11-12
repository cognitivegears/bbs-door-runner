const fatfs = require('fatfs');
const {createDriverSync} = require('./src/volumeDriver');

const driver = createDriverSync('v86/image/freedos20mb.img', {partitionNumber: 1, readOnly: true});
const fs = fatfs.createFileSystem(driver);
fs.stat('startup.bat', (e, stats) => {
	if (e) {
		console.error(e);
	} else {
		console.log(stats);
	}
});

fs.readFile('startup.bat', (err, contents) => {
	if (err) {
		contents.error(err);
	}

	console.log(contents.toString());
});
