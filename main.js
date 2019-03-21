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

const electron = require('electron');
const Menu = electron.Menu;
const Tray = electron.Tray;
const nativeImage = electron.nativeImage;

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

const optionDefinitions = [
	{
		name: 'hide',
		alias: 'h',
		type: Boolean
	}
];

const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);

const config = require(path.join(__dirname, 'includes', 'config'));
let _kiosk = config._kiosk;
let _locale = config._locale;


const l10n = new(require(path.join(__dirname, 'includes', 'l10n')));

_windowCreated = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, tray;

function createTray() {
	var tryImage;
	var imageFolder = __dirname + '/includes/icons';

	if (process.platform === 'win32') {
		trayImage = imageFolder + '/asta.ico';
	} else {
		trayImage = imageFolder + '/asta.png';
	}
	tray = new Tray(nativeImage.createFromPath(trayImage));
	var contextMenu = Menu.buildFromTemplate([
		{
			label: l10n.getString(56),
			click: function() {
				if (! _windowCreated) {
					createWindow();
				} else {
					mainWindow.show();
				}
			}
		},
		/*{
			label: l10n.getString(58),
			click: function() {
				mainWindow.webContents.openDevTools();
			}
		},*/
		{
			label: l10n.getString(57),
			click: function() {
				app.isQuitting = true;
				app.quit();
			}
		}
	]);
	tray.setToolTip(l10n.getString(0));
	if (! _kiosk) {
		tray.setContextMenu(contextMenu);
	}
	tray.on('click', function() {
		if (mainWindow.isVisible()) {
			mainWindow.hide();
		} else {
			if (! _windowCreated) {
				createWindow();
			} else {
				mainWindow.show();
			}
		}
	});
}

function createWindow() {
	_windowCreated = true;

	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1024,
		height: 768,
		minWidth: 800,
		minHeight: 600,
		title: l10n.getString(0),
		icon: "./includes/icons/asta.png"
	});

	// and load the index.html of the app.
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'web/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	mainWindow.on('minimize', function(event) {
		if (! _kiosk) {
			event.preventDefault();
			mainWindow.hide();
		}
	});

	mainWindow.on('close', function(event) {
		if (! app.isQuitting) {
			event.preventDefault();
			if (_kiosk) {
				mainWindow.minimize();
				mainWindow.webContents.executeJavaScript('document.dispatchEvent(new CustomEvent("logout"));');
			} else {
				mainWindow.hide();
			}
		}

		return false;
	});

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	});

	mainWindow.focus();
}

// Make sure there's only one instance of this running
var singletonLock = app.requestSingleInstanceLock();

if (! singletonLock) {
	app.quit();
	return;
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		if (mainWindow) {
			mainWindow.show();
			mainWindow.focus();
		}
	});
}

app.setAppUserModelId("de.upb.asta.copyclient");

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
	if (! _windowCreated) {
		createWindow();
		if (options.hide || config._startHidden) {
			mainWindow.minimize();
		} else if (_kiosk) {
			mainWindow.maximize();
		}
	}
	createTray();
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
})

app.on('activate', function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (! _windowCreated || mainWindow === null) {
		createWindow();
	}
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
