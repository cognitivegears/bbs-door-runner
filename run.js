const fatfs = require('fatfs');
const {createDriverSync} = require('./src/volumeDriver');

const driver = createDriverSync('v86/image/freedos722.img', {readOnly: true});
const fs = fatfs.createFileSystem(driver);
fs.stat('autoexec.bat', (e, stats) => {
	if (e) {
		console.error(e);
	} else {
		console.log(stats);
	}
});

fs.readFile('autoexec.bat', (err, contents) => {
	if (err) {
		contents.error(err);
	}

	console.log(contents.toString());
});
