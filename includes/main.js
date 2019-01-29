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

var _kioskTimeoutCnt = 0;
var _kioskTimeoutInterval;
var _kioskIsLoggedIn = false;
var _kioskPrint = [];

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