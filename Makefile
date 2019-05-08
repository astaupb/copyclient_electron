# @license LGPL-3.0-or-later
# Copyright (c) 2019 Michael Koch <m.koch@emkay443.de>
#
# This file is part of AStA Copyclient.
# AStA Copyclient is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# AStA Copyclient is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with AStA Copyclient.  If not, see <http://www.gnu.org/licenses/>.

default: install run

install:
	npm install

run:
	npm start

build:
	$(MAKE) install
ifdef SYSTEMROOT
	$(MAKE) build-win
else
ifeq ($(shell uname -s), Darwin)
	$(MAKE) build-mac
else
	$(MAKE) build-linux
endif
endif

clean:
	rm -rf dist

build-all:
	$(MAKE) install
	$(MAKE) build-linux
	$(MAKE) build-win
	$(MAKE) build-mac

build-win:
	./build_angular.sh
	./node_modules/.bin/electron-builder --win --ia32 --x64
	mv ./dist/AStA\ Copyclient\ *.exe ./dist/AStA\ Copyclient.exe
	makensis build_installer.nsi

build-mac:
	./build_angular.sh
	./node_modules/.bin/electron-builder --mac --x64

build-linux:
	./build_angular.sh
	env SHELL=bash ./node_modules/.bin/electron-builder --linux --ia32 --x64

include includes/make.mk