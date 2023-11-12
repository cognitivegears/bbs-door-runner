// Import required modules
const fatfs = require('fatfs');
const {createDriverSync} = require('./volumeDriver');

// Define module
class BbsDoorRunner {
// Ignore for now
//	constructor(options) {
//		// Define constructor logic here
//	}

	run() {
		// Define run logic here
		const driver = createDriverSync('v86/image/freedos722.img', {readOnly: true});
		const fs = fatfs.createFileSystem(driver);
		fs.stat('autoexec.bat', (e, stats) => {
			if (e) {
				console.error(e);
			} else {
				console.log(stats);
			}
		});
	}
}

// Export module
module.exports = BbsDoorRunner;
