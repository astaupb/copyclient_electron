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
  * Job list array.
  *
  * @type {Object[]}
  * @default []
  */
var _currentJobs = [];

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
 * Currently shown view.
 *
 * @type {String}
 * @default "login"
 */
var _currentView = "login";

/**
 * Whether drag-drop-handling has been set up or not.<br />
 * False if not set, or dragdrop's remove() function
 *
 * @type {boolean|function}
 * @default false
 */
var _dragDrop = false;

/**
 * Callback function.
 *
 * @type {function}
 * @default undefined
 */
var _callback;

/**
 * Callback function's arguments.
 *
 * @type {Array}
 * @default []
 */
var _callbackArgs = [];

/**
 * Print job UID to be printed.
 *
 * @type {String}
 * @default ""
 */
var _printJobID = "";

/**
 * Print job UID to be deleted.
 *
 * @type {String}
 * @default ""
 */
var _deleteJobUID = "";

/**
 * Switch the currently displayed &lt;div&gt; to the given one
 * while hiding all other &lt;div class='view'&gt;
 *
 * @param {String} view - View (usually a &lt;div&gt;) that should be displayed.
 * @see _currentView
 * @see showMessage
 */
function switchView(view) {

	if ($("#view-" + view).length) {
		$(".view").css("display", "none");
		$("#view-" + view).css("display", "");
		_currentView = view;
	} else {
		showMessage(getString(34).format(view), getString(43), "error");
	}
}

/**
 * Fetch username and password from the input dialog
 * and try them against the backend.<br />
 * If successful, switch view to the job list (if not in kiosk mode).<br /><br />
 *
 * If the client is set to kiosk mode and the global variable _callback is a valid function,
 * hide all views and the app window, and call the _callback function with _callbackArgs.
 *
 * @see _callBackend
 * @see _callback
 * @see _callbackArgs
 * @see showJobs
 * @see showMessage
 */
function doLogin() {
	var r;
	var user = $("#username").val();
	var pass = $("#password").val();

	_callBackend("/user/login", function(r) {
		if (r !== "error" && r !== "timeout") {
			localStorage.setItem("token", r);

			_callBackend("/user", function(s) {
				if (s !== "error" && s !== "timeout") {
					localStorage.setItem("username", s.name);
					localStorage.setItem("userid", s.id);
					localStorage.setItem("tokens", s.tokens);
					localStorage.setItem("credit", s.credit);

					if (! _kiosk) {
						showJobs();
					} else {
						$("#username").val("");
						$("#password").val("");
						$(".view").css("display", "none");
						currentWindow.hide();

						if (typeof _callback === "function") {
							_callback(..._callbackArgs);
						}
					}
				}
			}, 'GET');
		} else {
			showMessage(getString(35), getString(43), "error");
		}
	}, 'POST', undefined, user + ':' + pass);
}

/**
 * Log out the currently logged in user,
 * disable inotify watcher, job list refreshing
 * and drag-drop-handler.<br />
 * Switch the view to the login dialog and focus username field.
 *
 * @see unsetWatches
 * @see unsetIntervals
 * @see unsetDragDrop
 * @see switchView
 * @see _callBackend
 */
function doLogout() {

	if (localStorage.getItem("token") !== "") {
		_callBackend("/user/logout");
		localStorage.removeItem("token");
	}
	unsetWatches();
	unsetIntervals();
	unsetDragDrop();
	switchView("login");
	$("#username").val("");
	$("#password").val("");
	$("#username").focus();
}

/**
 * Show the login dialog for one-time login
 * and store given callback and callbackArgs as global variables
 * for the actual doLogin().<br />
 * This only works in kiosk mode.
 *
 * @param {function} callback - Callback function to be called after doLogin().
 * @param {Array} callbackArgs - Arguments for callback function.
 * @see _callback
 * @see _callbackArgs
 * @see currentWindow
 * @see switchView
 */
function doKioskLogin(callback, callbackArgs) {

	if (_kiosk) {
		_callback = callback;
		_callbackArgs = callbackArgs;

		if (! currentWindow.isVisible()) {
			currentWindow.show();
		}
		switchView("login");
		$("#username").val("");
		$("#password").val("");
		$("#username").focus();
		localStorage.clear();
	}
}

/**
 * Log user in when user presses enter (keyCode 13) on any of the dialog's input fields.
 *
 * @param {event} event - The keypress event of the invoker.
 * @see doLogin
 */
function loginKeypressEvent(event) {

	if (event.keyCode == 13) {
		doLogin();
	}
}

/**
 * Print job when user presses enter (keyCode 13) on the input field for device.
 *
 * @param {event} event - The keypress event of the invoker.
 * @see printJob
 */
function deviceKeypressEvent(event) {

	if (event.keyCode == 13) {
		printJob();
	}
}

/**
 * Try to fetch print jobs from backend.<br />
 * If successful, switch view to job list
 * and fill the list with all the user's jobs.<br />
 * If unsuccessful because of wrong token,
 * switch to login view.<br /><br />
 *
 * Also set up FS watcher, intervals and drag drop, if not already done.<br /><br />
 *
 * This can be used to refresh the job list and only works if not in kiosk mode.
 *
 * @see _currentJobs
 * @see doLogout
 * @see setupWatches
 * @see setupIntervals
 * @see setupDragDrop
 * @see switchView
 * @see _callBackend
 */
function showJobs() {
	var i, r, c;

	if (! _kiosk) {
		if (localStorage.getItem("token") !== "" && localStorage.getItem("token") !== null) {
			_callBackend("/jobs", function(r) {
				if (r !== "error" && r !== "timeout") {
					if (typeof _currentJobs === "string") {
						doLogout();
						return false;
					} else {
						_currentJobs = r;
						_currentJobs.sort(function(a, b) {
							return b.timestamp - a.timestamp;
						});
					}
					setupWatches();
					setupIntervals();
					setupDragDrop();

					switchView("jobs");
					$("#credit_amount").html(localStorage.getItem("credit"));

					if (_currentJobs === undefined || _currentJobs.length === 0) {
						$("#table-jobs").hide();
						$("#msg-jobs").show();
					} else {
						$("#table-jobs").show();
						$("#msg-jobs").hide();
						$("#table-jobs tbody").empty();
						for (var i in _currentJobs) {
							c = _currentJobs[i];
							$("#table-jobs tbody").append("<tr class='clickable' onclick='showJobDetailsWindow(\"" + c.id + "\");'>" +
							"<td><b>" + c.info.filename + "</b></td><td>" +
							c.info.pagecount + " " + (c.info.pagecount > 1 ? getString(36) : getString(37)) + ", " +
							(c.options.a3 ? getString(24) : getString(25)) + ", " +
							(c.info.color ? firstCharLowercase(getString(15)) : firstCharLowercase(getString(14))) + ", " +
							(c.options.duplex === 0 ? firstCharLowercase(getString(17)) : (c.options.duplex === 1 ? firstCharLowercase(getString(18)) : firstCharLowercase(getString(19)))) + ", " +
							((c.options.nup === 0 || c.options.nup === 1) ? firstCharLowercase(getString(38)) : firstCharLowercase(getString(39))) + ", " +
							(c.options.collate ? firstCharLowercase(getString(27)) : firstCharLowercase(getString(28))) + ", " +
							(c.options.keep ? firstCharLowercase(getString(30)) : firstCharLowercase(getString(31))) + " " + firstCharLowercase(getString(6)) + ", " +
							(c.options.nup !== 1 ? getString(62).format(c.options.nup, getString(36)) + ", " : "") +
							(c.options.range === "" ? firstCharLowercase(getString(40)) : firstCharLowercase(getString(71).format((c.options.range.includes(",") || c.options.range.includes("-") ? getString(36) : getString(37)), c.options.range))) +
							"</td></tr>");
						}
					}
				}
			}, 'GET');
		}
	}
}

/**
 * Fill the job details window with job information and show a preview image.<br />
 * The json parameter may seem unnecessary, but we're working from one Electron context
 * to another (two separate windows), so the global _currentJobs is not available there.
 *
 * @param {Object} json - Object containing _currentJobs array and job to show details on.
 * @see _currentJobs
 * @see printJob
 * @see showAskDeleteJob
 */
function showJobDetails(json) {
	var job = json.job;
	var r, xhr;
	_currentJobs = json._currentJobs;

	console.debug(job);

	_callBackend("/jobs/" + job.id + "/preview/0", function(r) {
		var reader = new FileReader();
		reader.onloadend = function() {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			image = $("#details_preview")[0];
			image.src = decodeURIComponent(escape(reader.result));
		}
		reader.readAsDataURL(new Blob([r], { type: "image/png" }));
	}, 'GET', undefined, undefined, undefined, [ { key: 'Accept', value: 'image/png' } ], 'blob');

	$("#details_header").append(job.info.filename);
	$("#details_uid").val(job.id);
	$("#details_printbutton").append("<button id='print_" + job.id + "' onclick='printJob(\"" + job.id + "\");'>" + getString(41) + "</button><br />" +
	"<button id='delete_" + job.id + "' onclick='showAskDeleteJob(\"" + job.id + "\", true);'>" + getString(42) + "</button><br /><br />");

	$("#details_copies").val(typeof job.options.copies === "number" ? (job.options.copies < 1 ? 1 : job.options.copies) : 1);
	$("#details_color").val(job.info.color ? 1 : 0);
	$("#details_duplex").val(typeof job.options.duplex === "number" ? job.options.duplex : 0);
	$("#details_paper").val(job.options.a3 ? 1 : 0);
	$("#details_nup").val(typeof job.options.nup === "number" ? job.options.nup : 1);
	$("#details_keep").val(job.options.keep ? 1 : 0);
	$("#details_collate").val(job.options.collate ? 1 : 0);
	$("#details_range").val(typeof job.options.range === "string" || typeof job.options.range === "number" ? job.options.range : "");
}

/**
 * Open a new Electron window, load job details HTML and run
 * showJobDetails in the newly created context.<br />
 * Focus the details window at the end.<br />
 * This won't work if the UID is invalid or there are multiple
 * jobs with the same UID (this should never happen).<br />
 * In these cases, exit with an appropriate message.
 *
 * @param {String} id - The print job's unique identifier.
 * @see _currentJobs
 * @see showJobDetails
 * @see showMessage
 */
function showJobDetailsWindow(id) {

	var found = $.grep(_currentJobs, function(element, index) {
		return element.id === parseInt(id);
	});

	if (found.length === 1) {
		var job = found[0];
		var detailsWindow = new remote.BrowserWindow({
			width: 800,
			height: 600,
			minWidth: 800,
			minHeight: 600,
			title: getString(11) + ": " + job.info.filename,
			icon: "./icons/asta.png"
		});

		detailsWindow.loadURL(remote.require('url').format({
			pathname: remote.require('path').join(__dirname, 'jobdetails.html'),
			protocol: 'file:',
			slashes: true
		}));

		var cont = detailsWindow.webContents;
		//cont.openDevTools();
		cont.on("dom-ready", function() {
			var json = {
				"_currentJobs": _currentJobs,
				"job": job
			};
			cont.executeJavaScript("showJobDetails(" + JSON.stringify(json) + ");");
			//cont.openDevTools();
		});

		detailsWindow.focus();
	} else if (found.length > 1) {
		showMessage(getString(44), getString(43), "error");
	} else {
		showMessage(getString(45), getString(43), "error");
	}
}

/**
 * Command the backend to print a job on a printer.<br />
 * Job id is either given as first parameter, or from global _printJobID.<br />
 * Printer ID is either given as second parameter, or from the #device input field.
 *
 * @param {String} [id=_printJobID] - The print job's unique identifier.
 * @param {String} [device=$("#device").val()] - The printer's identifier.
 * @param {boolean} [closeAfter=false] - Whether to close the window after printing (only works in kiosk mode).
 * @see _printJobID
 * @see _callBackend
 * @see showMessage
 */
function printJob() {
	var id = arguments.length > 0 && arguments[0] !== undefined && arguments[0] !== null ? arguments[0] : _printJobID;
	var device = arguments.length > 1 && arguments[1] !== undefined && arguments[1] !== null ? arguments[1] : $("#device").val();
	var closeAfter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
	var r;

	if (_kiosk && (localStorage.getItem("token") === "" || localStorage.getItem("token") === null)) {
		doKioskLogin(printJob, []);
	} else if (localStorage.getItem("token") !== "" && localStorage.getItem("token") !== null) {
		_callBackend("/printers/" + device + "/queue?id=" + id, function(r) {
			if (_kiosk && localStorage.getItem("token") !== "" && localStorage.getItem("token") !== null) {
				localStorage.removeItem("token");
			}
			if (r !== "error" && r !== "timeout") {
				showMessage(getString(47), getString(46));
				if (closeAfter) {
					closeCurrentWindow();
				}
			}
		});
	} else {
		if (_kiosk && localStorage.getItem("token") !== "" && localStorage.getItem("token") !== null) {
			localStorage.removeItem("token");
		}
		return false;
	}

	return true;
}

/**
 * Ask the user whether to delete the job with the given UID or not.<br />
 * If they choose to do so, execute deleteJob with the given UID.
 *
 * @param {String} uid - The print job's unique identifier.
 * @param {boolean} [closeAfter=false] - Whether to close the window after deleting (only works in kiosk mode).
 * @see deleteJob
 * @see closeCurrentWindow
 * @see _deleteJobUID
 */
function showAskDeleteJob(uid) {
	var closeAfter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	_deleteJobUID = uid;

	showMessage(getString(49),
		getString(42),
		"question",
		{
			"buttons": [
				{
					"label": getString(50),
					"action": function() {
						deleteJob(_deleteJobUID);
						if (closeAfter) {
							closeCurrentWindow();
						}
					}
				}
			]
		}
	);
}

/**
 * Request deletion of the job with the given UID on the backend.<br />
 * Only works when not in kiosk mode.
 *
 * @param {String} id - The print job's unique identifier.
 * @see _callBackend
 * @see _deleteJobid
 * @see showJobs
 */
function deleteJob(id) {
	var r;

	if (! _kiosk) {
		_callBackend("/jobs/" + id, function(r) {
			if (r !== "error" && r !== "timeout") {
				console.log("job " + id + " successfully deleted");
			}
			_deleteJobUID = "";
			showJobs();
		}, 'DELETE');
	}
}

/**
 * Upload a given file in chunks to the backend.<br />
 * If in kiosk mode, first request a kiosk login
 * (thus showing the login window and setting _callback with arguments).<br /><br />
 * If set, show a system notification with the given file's name.
 *
 * @param {String} jobfile - The full path to the job file to be uploaded.
 * @param {boolean} [delFile=true] - Whether to delete the job file after uploading or not.
 * @param {boolean} [uploadNotif=false] - Whether to show a notification after uploading or not.
 * @param {Object} [uploadNotifFile={}] - The original print job. This is needed to get the original job name when showing a notification.
 * @see doKioskLogin
 * @see _callBackend
 * @see showJobs
 */
function uploadJob(jobfile) {
	var delFile = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
	var uploadNotif = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
	var uploadNotifFile = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
	var r;
	var fs = require("fs");
	var path = require("path");
	var mime = require("mime-types");
	var readline = require("readline");
	var cnt = 1;
	var filename = path.basename(jobfile);
	var filesize_b = fs.statSync(jobfile).size;
	var filesize_mb = (filesize_b / 1000000.0).toFixed(2);

	if (_kiosk && (localStorage.getItem("token") === "" || localStorage.getItem("token") === null)) {
		doKioskLogin(uploadJob, [jobfile, delFile, uploadNotif, uploadNotifFile]);
	} else if (localStorage.getItem("token") !== "" && localStorage.getItem("token") !== null) {
		fs.readFile(jobfile, function(err, data) {
			if (! err) {
				_callBackend("/jobs?filename=" + filename + "&color=true", function(r) {
					if (r !== "error" && r !== "timeout") {
						console.log("completed uploading");
						new Notification(getString(51), {
							body: getString(52).format(filename, filesize_mb)
						});
						if (delFile) {
							fs.unlink(jobfile, function(err) {
								if (! err) {
									console.log("file " + filename + " successfully deleted");
								} else {
									console.error("could not delete file " + filename);
								}
							});
						}
						window.setTimeout(function() {
							showJobs();
						}, 2000);
					} else {
						console.error("could not complete uploading");
					}
				}, 'POST', undefined, undefined, {
					'type': 'application/pdf',
					'content': data
				});
				if (_kiosk && localStorage.getItem("token") !== "" && localStorage.getItem("token") !== null) {
					localStorage.removeItem("token");
				}
			}
		});
	}
}

/**
 * Update a print job's option.
 *
 * @param {String} key - Option key.
 * @param {number|String} [value=$("#details_" + key).val()] - Option value.
 * @see _callBackend
 */
function updateJobOption(key) {
	var value = arguments.length > 1 && arguments[1] !== undefined && arguments[1] !== null ? arguments[1] : $("#details_" + key).val();
	var id = $("#details_uid").val();
	var options = {};

	if (! isNaN(value) && key !== "range") {
		options[key] = parseInt(value);
	} else {
		options[key] = value.toString();
	}

	switch (key) {
		case "range":
			var validChars = /^[0-9,-]*$/;
			if (! validChars.test(value)) {
				console.error("Invalid value given, exiting");
				return;
			}
			break;
		case "copies":
			if (parseInt(value) < 1) {
				$("#details_" + key).val("1");
				options[key] = 1;
			} else if (parseInt(value) > 999) {
				$("#details_" + key).val("999");
				options[key] = 999;
			}
			break;
		case "color":
		case "paper":
		case "collate":
		case "keep":
			if (! [0, 1].includes(parseInt(value))) {
				$("#details_" + key).val("0");
				options[key] = false;
			} else {
				options[key] = !!value;
			}
			break;
		case "duplex":
			if (! [0, 1, 2].includes(parseInt(value))) {
				$("#details_" + key).val("0");
				options[key] = 0;
			}
			break;
		case "nuppageorder":
			if (! [0, 1, 2, 3].includes(parseInt(value))) {
				$("#details_" + key).val("0");
				options[key] = 0;
			}
			break;
		case "nup":
			if (! [1, 2, 4].includes(parseInt(value))) {
				$("#details_" + key).val("1");
				options[key] = 1;
			}
			break;
		default:
			showMessage(getString(72), getString(43));
			return;
	}

	_callBackend("/jobs/" + id + "/options/" + key, function(r) {
		if (r !== "error" && r !== "timeout") {
			console.log("Updated option " + key + " to value " + value);
		}
	}, 'PUT', undefined, undefined, {
		'type': 'application/json',
		'content': value
	});
}

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
 * If not in kiosk mode, set all needed intervals, i.e. job list refreshing.
 *
 * @see _intervalJobs
 * @see _currentView
 * @see showJobs
 */
function setupIntervals() {

	if (!_kiosk && _intervalJobs === undefined) {
		_intervalJobs = window.setInterval(function() {
			if (_currentView === "jobs") {
				showJobs();
			}
		}, 30000);
	}
}

/**
 * If not in kiosk mode and intervals have already been set, clear intervals.
 *
 * @see _intervalJobs
 */
function unsetIntervals() {

	if (! _kiosk && _intervalJobs !== undefined) {
		window.clearInterval(_intervalJobs);
		_intervalJobs = undefined;
	}
}

/**
 * Set up Chokidar file system watcher.<br />
 * This will watch a specific directory
 * (C:\astaprint on Windows, /tmp/astaprint for UNIX)
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
				stabilityThreshold: 2000,
				pollInterval: 100
			}
		});

		_watcher.on("add", function(path) {
			uploadJob(path);
		});
		_watcher.on("change", function(path) {
			uploadJob(path);
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
					uploadJob(file.path, false, true, file);
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

/**
 * Do initial setup after loading the DOM.<br />
 * If in kiosk mode, hide all windows, setup drag-drop-handling,
 * FS watcher and hide the main window to systray.<br />
 * If not, try to show job list.
 * If not successful (because of not being logged in), show login dialog.
 *
 * @see setupDragDrop
 * @see setupWatches
 * @see switchView
 * @see currentWindow
 */
function init() {

	if (_kiosk) {
		$(".view").css("display", "none");
		localStorage.clear();
		setupDragDrop();
		setupWatches();
		currentWindow.hide();
	} else {
		if (localStorage.getItem("token") === undefined || localStorage.getItem("token") === null) {
			switchView("login");
		} else {
			showJobs();
		}
	}
}
