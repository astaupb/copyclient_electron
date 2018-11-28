/**
 * @license LGPL-3.0-or-later
 * Copyright (c) 2018 Michael Koch <m.koch@emkay443.de>
 *
 * This file is part of AStA Copyclient.
 * AStA Copyclient is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AStA Copyclient is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with AStA Copyclient.  If not, see <http://www.gnu.org/licenses/>.
 */

 /**
  * jQuery.
  */
const $ = require('jquery');

/**
 * UnderscoreJS.
 */
const _ = require('underscore');

/**
 * Drag-drop handler.
 */
const dragDrop = require('drag-drop');

/**
 * Electron remote and BrowserWindow.
 */
const { remote, BrowserWindow } = require('electron');

/**
 * Current window in Electron app.
 */
const currentWindow = remote.getCurrentWindow();

/**
 * Better dialogs for Electron.
 */
const showBetterMessageBox = remote.require('electron-better-dialog').showBetterMessageBox;

/**
 * Append token (if set) to the POST arguments
 * of a freshly opened XMLHttpRequest.<br />
 * Do a bit of error handling and call callback function accordingly.
 *
 * @param {String} request - Request
 * @param {function} [callback=function() {}] - Callback function for XHR
 * @param {String} [type='POST'] - XHR type
 * @param {number} [timeout=10000] - Timeout in ms
 * @param {String} [auth=''] - Basic Authentication credentials
 * @param {Array} [extraHeaders=[]] - Extra headers to be sent
 * @param {String} [responseType=undefined] - Custom response type
 */
function _callBackend(request) {
	var http, json;
	var callback = arguments.length > 1 && arguments[1] !== undefined && typeof arguments[1] === "function" ? arguments[1] : function() {};
	var type = arguments.length > 2 && arguments[2] !== undefined && typeof arguments[2] === "string" ? arguments[2] : 'POST';
	var timeout = arguments.length > 3 && arguments[3] !== undefined && typeof arguments[3] === "number" ? arguments[3] : 10000;
	var auth = arguments.length > 4 && arguments[4] !== undefined && typeof arguments[4] === "string" ? arguments[4] : '';
	var payload = arguments.length > 5 && arguments[5] !== undefined && typeof arguments[5] === "object" ? arguments[5] : undefined;
	var extraHeaders = arguments.length > 6 && arguments[6] !== undefined && _.isArray(arguments[6]) ? arguments[6] : [];
	var responseType = arguments.length > 7 && arguments[7] !== undefined && typeof arguments[7] === "string" ? arguments[7] : undefined;

	try {
		http = new XMLHttpRequest();
		http.open(type, backend + '/' + request, true);
		http.timeout = timeout;
		if (localStorage.getItem("token")) {
			http.setRequestHeader('X-API-Key', localStorage.getItem("token"));
		}
		if (auth !== '') {
			http.setRequestHeader('Authorization', 'Basic ' + btoa(auth));
		}
		http.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		$.each(extraHeaders, function(index, header) {
			http.setRequestHeader(header.key, header.value);
		});
		if (responseType !== undefined) {
			http.responseType = responseType;
		}
		if (typeof payload === "object" && typeof payload.type === "string") {
			http.setRequestHeader('Content-Type', payload.type);
			http.send(payload.content);
		} else {
			http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			http.send();
		}
	} catch (e) {
		console.debug("_callBackend: _httpGet failed");
		return;
	}

	http.onload = function(e) {
		if (http.readyState === 4) {
			if (http.status === 200 || http.status === 202 || http.status === 205) {
				if (http.response === "" || http.response === null) {
					console.debug("_callBackend: empty response");
					callback('error', e);
				} else {
					try {
						json = JSON.parse(http.responseText);
						callback(json);
					} catch (e) {
						callback(http.response);
					}
				}
			} else {
				callback('error', e);
			}
		}
	}

	http.onerror = function(e) {
		callback('error', e);
	}

	http.ontimeout = function(e) {
		callback('timeout', e);
	}
}

/**
 * Close Electron's currently shown window.
 */
function closeCurrentWindow() {

	currentWindow.close();
}

/**
 * Lowercase a given string's first char and return the result.
 *
 * @param {String} str - The string whose first char we want to lowercase.
 * @returns {String} - Lowercased string
 */
function firstCharLowercase(str) {

	return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Show a message box dialog with the given message and, optionally, title, type and other options.
 *
 * @param {String} s - The dialog window's text.
 * @param {String} [title="Information"] - The dialog window's title.
 * @param {String} [type="info"] - The dialog window's type. Allowed values: none, info, error, question, warning.
 * @param {Object} [options={}] - Custom options for the dialog, such as buttons.
 * @returns {Object|void} - What electron-better-dialog returns.
 */
function showMessage(s) {
	var title = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getString(54);
	var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "info";
	var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

	var defaultButtons = [{
		label: getString(55),
		isCancel: true
	}];

	var defaultOptions = {
		title: title,
		type: type,
		message: s,
		betterButtons: defaultButtons
	};

	if (!_.isEmpty(options)) {
		_.extend(defaultOptions, _.omit(options, 'buttons'));
		if (Array.isArray(options.buttons)) {
			defaultOptions.betterButtons = options.buttons.concat(defaultButtons);
		}
		if (typeof options.onClose === "function") {
			defaultOptions.betterButtons[0].action = options.onClose;
		}
	}

	return showBetterMessageBox(currentWindow, defaultOptions, function(response) {
		if (response.action) {
			response.action();
		}
	});
}

/**
 * This adds a nice format function known from other languages
 * to the String prototype
 */
if (! String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] !== 'undefined' ? args[number] : match;
		});
	};
}