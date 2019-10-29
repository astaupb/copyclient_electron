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

include includes/make.mk

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

build-windows: build-win
build-win:
	./change_config.sh disable_kiosk
	./change_config.sh disable_starthidden
	-@rm -rf dist 2>/dev/null || true
	./build_angular.sh
	./node_modules/.bin/electron-builder --win --ia32 --x64
	mv ./dist/AStA\ Copyclient\ *.exe ./dist/AStA\ Copyclient.exe
	makensis build_installer.nsi
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/windows/${VERSION}'
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/windows/current'
	scp dist/setup-copyclient.exe ${deploy_user}@${deploy_host}:${dist_folder}/public/windows/${VERSION}/setup-copyclient_${VERSION}.exe
	ssh ${deploy_user}@${deploy_host} 'ln -sf ${dist_folder}/public/windows/${VERSION}/setup-copyclient_${VERSION}.exe ${dist_folder}/public/windows/current/setup-copyclient.exe'

build-mac:
	./build_angular.sh
	./node_modules/.bin/electron-builder --mac --x64

build-linux:
	./change_config.sh disable_kiosk
	./change_config.sh disable_starthidden
	-@rm -rf dist 2>/dev/null || true
	./build_angular.sh
	env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/linux/${VERSION}'
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/linux/current'
	scp dist/asta-copyclient*.deb ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.deb
	scp dist/asta-copyclient*.rpm ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.rpm
	scp dist/asta-copyclient*.pacman ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}_archlinux.tar.xz
	scp dist/asta-copyclient*.tar.gz ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}_generic.tar.gz
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.deb ${dist_folder}/public/linux/current/asta-copyclient.deb"
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.rpm ${dist_folder}/public/linux/current/asta-copyclient.rpm"
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}_archlinux.tar.xz ${dist_folder}/public/linux/current/asta-copyclient_archlinux.tar.xz"
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}_generic.tar.gz ${dist_folder}/public/linux/current/asta-copyclient_generic.tar.gz"

build-debug:
	-@rm -rf dist 2>/dev/null || true
	./build_angular.sh left 44336
	env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64

build-directprint:
	./change_config.sh enable_kiosk
	./change_config.sh disable_starthidden
	-@rm -rf dist 2>/dev/null || true
	for id in ${directprint_left}; do \
		./build_angular.sh left $$id; \
		env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64; \
		ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/directprint/${VERSION}/$$id"; \
		ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/directprint/current/$$id"; \
		scp dist/asta-copyclient*.deb ${deploy_user}@${deploy_host}:${dist_folder}/directprint/${VERSION}/$$id/asta-copyclient.deb; \
		ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/directprint/${VERSION}/$$id/asta-copyclient.deb ${dist_folder}/directprint/current/$$id/asta-copyclient.deb"; \
	done
	for id in ${directprint_right}; do \
		./build_angular.sh right $$id; \
		env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64; \
		ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/directprint/${VERSION}/$$id"; \
		ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/directprint/current/$$id"; \
		scp dist/asta-copyclient*.deb ${deploy_user}@${deploy_host}:${dist_folder}/directprint/${VERSION}/$$id/asta-copyclient.deb; \
		ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/directprint/${VERSION}/$$id/asta-copyclient.deb ${dist_folder}/directprint/current/$$id/asta-copyclient.deb"; \
	done

build-kiosk:
	./change_config.sh enable_kiosk
	./change_config.sh enable_starthidden
	-@rm -rf dist 2>/dev/null || true
	./build_angular.sh
	env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64
	ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/kiosk/${VERSION}"
	ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/kiosk/current"
	scp dist/asta-copyclient*.deb ${deploy_user}@${deploy_host}:${dist_folder}/kiosk/${VERSION}/asta-copyclient_${VERSION}.deb
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/kiosk/${VERSION}/asta-copyclient_${VERSION}.deb ${dist_folder}/kiosk/current/asta-copyclient.deb"

build-deploy: build-kiosk build-directprint build-linux build-win
	cd ../astansible; make setup_copyclient