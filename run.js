const fs = require("node:fs");
const fatfs = require("fatfs");
const unzipper = require("unzipper");
const { createBufferDriverSync } = require("fatfs-volume-driver");
const BbsDoorRunner = require("./src/BbsDoorRunner");

// Use the fs module to read v86/image/freedos20mb.img
const buffer = fs.readFileSync("v86/image/freedos20mb.img");

const driver = createBufferDriverSync("", {
	buffer,
	partitionNumber: 1,
	readOnly: false,
});
const fsf = fatfs.createFileSystem(driver);
fsf.stat("startup.bat", (e, stats) => {
	if (e) {
		console.error(e);
	} else {
		console.log(stats);
	}
});

fsf.readFile("startup.bat", (err, contents) => {
	if (err) {
		contents.error(err);
	}

	console.log(contents.toString());
});

const streamReadPromise = new Promise((resolve, reject) => {
	fs.createReadStream("__tests__/resources/simpletest.zip")
		// eslint-disable-next-line new-cap
		.pipe(unzipper.Parse())
		.on("entry", async (entry) => {
			const fileName = entry.path;
			if (entry.type === "File") {
				const content = await entry.buffer();
				await new Promise((resolve, reject) => {
					fsf.writeFile(fileName, content, (err) => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				});
			} else if (entry.type === "Directory") {
				fsf.mkdir(fileName);
			}
		})
		.on("finish", () => {
			resolve();
		})
		.on("error", (err) => {
			reject(err);
		});
});

streamReadPromise.then(() => {
	fsf.readFile("a.txt", (err, contents) => {
		if (err) {
			console.log(err);
		}

		console.log("got contents");
		console.log(contents.toString());
	});
});

console.log("Starting console up");

const bbsDoorRunner = new BbsDoorRunner();
bbsDoorRunner.runConsole();
