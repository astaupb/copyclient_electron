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

let json;
const path = require("path");
const electron = require('electron');
const fs = require('fs');
const config = require(path.join(__dirname, 'config.js'));
_locale = config._locale;
let app = electron.app ? electron.app : electron.remote.app;

module.exports = l10n;

function l10n() {

	if (typeof _locale === "undefined") {
		console.warn("_locale hasn't been set in config.js, falling back to default locale (German).")
		_locale = "de";
	}

	try {
		json = JSON.parse(fs.readFileSync(path.join(__dirname, (__dirname.includes('includes') ? '': 'includes'), 'locales', _locale + '.json'), 'utf8'));
	} catch (e) {
		console.warn("Couldn't find locale, falling back to default locale (German).");
		try {
			json = JSON.parse(fs.readFileSync(path.join(__dirname, (__dirname.includes('includes') ? '': 'includes'), 'locales/de.json'), 'utf8'));
		} catch (e2) {
			console.error("Couldn't find default locale (German), giving up.");
		}
	}
}

l10n();

function getString(id) {

	if (json.hasOwnProperty(id)) {
		return json[id];
	}

	return "STRING NOT FOUND";
}

function writeString(id) {

	document.write(getString(id));
}

l10n.prototype.getString = function(id) { return getString(id); };