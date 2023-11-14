const fs = require('fs');
const unzipper = require('unzipper');

async function extractZipToFatfs(zipFilePath, fsf) {
	const readStream = fs.createReadStream(zipFilePath);

	return new Promise((resolve, reject) => {
		readStream
			// eslint-disable-next-line new-cap
			.pipe(unzipper.Parse())
			.on('entry', async entry => {
				const fileName = entry.path;

				if (entry.type === 'File') {
					const content = await entry.buffer();
					await new Promise((resolve, reject) => {
						fsf.writeFile(fileName, content, err => {
							if (err) {
								reject(err);
							} else {
								resolve();
							}
						});
					});
				} else if (entry.type === 'Directory') {
					fsf.mkdir(fileName);
				}
			})
			.on('finish', () => {
				resolve();
			})
			.on('error', err => {
				reject(err);
			});
	});
}

module.exports = {
	extractZipToFatfs,
};
