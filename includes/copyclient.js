/**
 * @license LGPL-3.0-or-later
 * Copyright (c) 2018 Michael Koch <m.koch@emkay443.de>
 *
 * This file is part of AStA Copyclient.
 * AStA Copyclient is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * AStA Copyclient is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AStA Copyclient.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Chokidar FS watcher (inotify-like).
 *
 * @type {FSWatcher}
 * @default undefined
 */
var _watcher;

/**
 * Job list refresh interval ID.
 *
 * @type {number}
 * @default undefined
 */
var _intervalJobs;

/**
 * Whether drag-drop-handling has been set up or not.<br />
 * False if not set, or dragdrop's remove() function
 *
 * @type {boolean|function}
 * @default false
 */
var _dragDrop = false;

/**
 * Upload a given file in chunks to the backend.<br />
 * If in kiosk mode, first request a kiosk login
 * (thus showing the login window and setting _callback with arguments).<br /><br />
 * If set, show a system notification with the given file's name.
 *
 * @param {String} jobfile - The full path to the job file to be uploaded.
 * @param {boolean} [delFile=true] - Whether to delete the job file after uploading or not.
 */
function uploadJob(jobfile) {
	var delFile = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
	var r;
	var fs = require("fs");
	var path = require("path");
	var mime = require("mime-types");
	var readline = require("readline");
	var cnt = 1;
	var filename = path.basename(jobfile);
	var filesize_b = fs.statSync(jobfile).size;
	var filesize_mb = (filesize_b / 1000000.0).toFixed(2);

	if (filename === "astaprint_windows10.pdf") {
		filename = "";
	}

	console.log("Reading " + filename);
	fs.readFile(jobfile, function(err, data) {
		if (! err) {
			console.log("Sending " + filename + " via custom event to Dart");
			document.dispatchEvent(new CustomEvent("uploadJob", {
				detail: JSON.stringify({
					filename: filename,
					data: data.toString('base64')
				})
			}));
			if (delFile) {
				fs.unlink(jobfile, function(err) {
					if (! err) {
						console.log("file " + filename + " successfully deleted");
					} else {
						console.error("could not delete file " + filename);
					}
				});
			}
			if (_kiosk) {
				if (! currentWindow.isVisible()) {
					currentWindow.show();
				}
				_kioskNotification = [getString(51), getString(52).format(filename, filesize_mb)];
			} else {
				new Notification(getString(51), {
					body: getString(52).format(filename, filesize_mb)
				});
			}
		}
	});
}

/**
 * Show "open file" dialog
 */
function showOpenPDF() {

	remote.dialog.showOpenDialog({
		filters: [
			{
				name: getString(59),
				extensions: ['pdf']
			}
		],
		properties: [
			'openFile',
			'multiSelections',
			'showHiddenFiles',
			'createDirectory'
		]
	}, function(files) {
		if (files === undefined) return;

		$.each(files, function(index, file) {
			uploadJob(file, false);
		});
	});
}

/**
 * Set up Chokidar file system watcher.<br />
 * This will watch the spool directory
 * for new and changed files and execute uploadJob on them.
 *
 * @returns {boolean} - Whether setting up watcher was succesful or not.
 * @see uploadJob
 * @see _watcher
 */
function setupWatches() {
	var path;

	if (_watcher === undefined) {
		var c = require("chokidar");
		var fs = require("fs");

		switch (process.platform) {
			case "win32":
				path = process.env.SYSTEMDRIVE + "/astaprint";
				break;
			default:
				path = "/var/spool/astaprint";
		}

		if (! fs.existsSync(path)) {
			console.log("Spool directory doesn't exist, trying to create it...");
			try {
				fs.mkdirSync(path);
			} catch (error) {
				console.error("Can't create spool directory: " + error);
				return false;
			}
		}

		_watcher = c.watch(path, {
			awaitWriteFinish: {
				stabilityThreshold: 4000,
				pollInterval: 100
			}
		});

		_watcher.on("add", function(path) {
			if (! _kiosk || _kioskIsLoggedIn) {
				uploadJob(path);
			} else if (_kiosk && ! _kioskIsLoggedIn) {
				_kioskPrint.push(path);
				if (! currentWindow.isVisible()) {
					currentWindow.show();
				}
			}
		});
		_watcher.on("change", function(path) {
			if (! _kiosk || _kioskIsLoggedIn) {
				uploadJob(path);
			} else if (_kiosk && ! _kioskIsLoggedIn) {
				_kioskPrint.push(path);
				if (! currentWindow.isVisible()) {
					currentWindow.show();
				}
			}
		});
		_watcher.on("unlink", function(path) {
			console.log("unlink: " + path);
		});
		_watcher.on("error", function(error) {
			console.log("error: " + error);
		});
	}

	return true;
}

/**
 * Close FS watcher if not undefined.
 *
 * @see _watcher
 */
function unsetWatches() {

	if (_watcher !== undefined) {
		_watcher.close();
		_watcher = undefined;
	}
}

/**
 * Set up drag-drop-handler.<br />
 * This will execute uploadJob on a dropped PDF file.
 *
 * @see uploadJob
 * @see _dragDrop
 */
function setupDragDrop() {

	if (! _dragDrop) {
		_dragDrop = dragDrop('body', function (files, pos, fileList, directories) {
			$.each(fileList, function(index, file) {
				if (file.type === "application/pdf") {
					uploadJob(file.path, false);
				}
			});
		});
	}
}

/**
 * Remove drag-drop-handling if set.
 *
 * @see _dragDrop
 */
function unsetDragDrop() {

	if (_dragDrop !== false) {
		_dragDrop();
		_dragDrop = false;
	}
}

function setupInterval() {
	if (_kiosk) {
		_kioskTimeoutInterval = window.setInterval(function() {
			if (_kioskTimeoutCnt >= _kioskTimeoutMax) {
				document.dispatchEvent(new CustomEvent("logout"));
				window.clearInterval(_kioskTimeoutInterval);
				_kioskTimeoutCnt = 0;
			} else {
				_kioskTimeoutCnt++;
			}
			//console.log("kiosk timeout counter: " + _kioskTimeoutCnt + "s of max. " + _kioskTimeoutMax + "s till logout");
		}, 1000);
	}
}

if (_kiosk) {
	setupWatches();
	setupDragDrop();
}

document.addEventListener("loggedIn", function(event) {
	console.log("Caught event loggedIn");
	setupInterval();

	if (_kiosk) {
		_kioskIsLoggedIn = true;
		$.each(_kioskPrint, function(i, e) {
			uploadJob(e);
		});
		_kioskPrint = [];
	} else {
		setupWatches();
		setupDragDrop();
	}
});

document.addEventListener("loggedOut", function(event) {
	console.log("Caught event loggedOut");
	window.clearInterval(_kioskTimeoutInterval);

	if (_kiosk) {
		_kioskIsLoggedIn = false;
	} else {
		unsetWatches();
		unsetDragDrop();
	}
});

document.addEventListener("showOpenPDF", function(event) {
	console.log("Caught event showOpenPDF");
	showOpenPDF();
});

if (_kiosk) {
	$("*").on("mousemove mouseenter keydown focus", function() {
		_kioskTimeoutCnt = 0;
		//console.log("detected activity");
	});
}