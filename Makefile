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

deploy:
	cd ../astansible; make setup_copyclient

build-all: install build-kiosk build-directprint build-linux build-windows

build-deploy: build-all deploy

build-windows: build-win
build-win:
	./build/change_config.sh disable_kiosk
	./build/change_config.sh disable_starthidden
	-@rm -rf dist 2>/dev/null || true
	./build/build_angular.sh
	./node_modules/.bin/electron-builder --win --ia32 --x64
	mv ./dist/AStA\ Copyclient\ *.exe ./dist/AStA\ Copyclient.exe
	makensis ./build/build_installer.nsi
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/windows/${VERSION}'
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/windows/current'
	scp dist/setup-copyclient.exe ${deploy_user}@${deploy_host}:${dist_folder}/public/windows/${VERSION}/setup-copyclient_${VERSION}.exe
	ssh ${deploy_user}@${deploy_host} 'ln -sf ${dist_folder}/public/windows/${VERSION}/setup-copyclient_${VERSION}.exe ${dist_folder}/public/windows/current/setup-copyclient.exe'

build-mac:
	./build/change_config.sh disable_kiosk
	./build/change_config.sh disable_starthidden
	-@rm -rf dist 2>/dev/null || true
	./build/build_angular.sh
	CSC_IDENTITY_AUTO_DISCOVERY=false
	sudo rm -rf dist
	./node_modules/.bin/electron-builder --mac --x64
	productsign --sign "Developer ID Installer: ASTA Allgemeiner Studentenausschuss Uni Paderborn (VK3N2H79U2)" dist/AStA\ Copyclient-${VERSION}.pkg dist/AStA\ Copyclient-${VERSION}_signed.pkg
	xcrun altool --notarize-app --primary-bundle-id "de.upb.asta.copyclient-mac" -t osx -f dist/AStA\ Copyclient-${VERSION}_signed.pkg -u ${APPLE_ACCOUNT} -p ${APPLE_PASSWORD}
	sleep 180
	xcrun altool --notarization-history -u ${APPLE_ACCOUNT} -p ${APPLE_PASSWORD}
	xcrun stapler staple dist/AStA\ Copyclient-${VERSION}_signed.pkg
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/mac/${VERSION}'
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/mac/current'
	scp dist/AStA\ Copyclient-${VERSION}_signed.pkg ${deploy_user}@${deploy_host}:${dist_folder}/public/mac/${VERSION}/asta-copyclient_${VERSION}.pkg
	ssh ${deploy_user}@${deploy_host} 'ln -sf ${dist_folder}/public/mac/${VERSION}/asta-copyclient_${VERSION}.pkg ${dist_folder}/public/mac/current/asta-copyclient.pkg'

build-linux:
	./build/change_config.sh disable_kiosk
	./build/change_config.sh disable_starthidden
	./build/change_config.sh build_all_linux
	-@rm -rf dist 2>/dev/null || true
	./build/build_angular.sh
	env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/linux/${VERSION}'
	ssh ${deploy_user}@${deploy_host} 'mkdir -p ${dist_folder}/public/linux/current'
	scp dist/asta-copyclient*.deb ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.deb
	scp dist/asta-copyclient*.rpm ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.rpm
	scp dist/asta-copyclient*.snap ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.snap
	scp dist/asta-copyclient*.pacman ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}_archlinux.tar.xz
	scp dist/asta-copyclient*.tar.gz ${deploy_user}@${deploy_host}:${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}_generic.tar.gz
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.deb ${dist_folder}/public/linux/current/asta-copyclient.deb"
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.rpm ${dist_folder}/public/linux/current/asta-copyclient.rpm"
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}.snap ${dist_folder}/public/linux/current/asta-copyclient.snap"
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}_archlinux.tar.xz ${dist_folder}/public/linux/current/asta-copyclient_archlinux.tar.xz"
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/public/linux/${VERSION}/asta-copyclient_${VERSION}_generic.tar.gz ${dist_folder}/public/linux/current/asta-copyclient_generic.tar.gz"

build-debug:
	-@rm -rf dist 2>/dev/null || true
	./build/build_angular.sh left 44336
	env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64

build-directprint:
	./build/change_config.sh enable_kiosk
	./build/change_config.sh disable_starthidden
	./build/change_config.sh build_only_deb
	-@rm -rf dist 2>/dev/null || true
	for id in ${directprint_left}; do \
		./build/build_angular.sh left $$id; \
		env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64; \
		ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/directprint/${VERSION}/$$id"; \
		ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/directprint/current/$$id"; \
		scp dist/asta-copyclient*.deb ${deploy_user}@${deploy_host}:${dist_folder}/directprint/${VERSION}/$$id/asta-copyclient.deb; \
		ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/directprint/${VERSION}/$$id/asta-copyclient.deb ${dist_folder}/directprint/current/$$id/asta-copyclient.deb"; \
	done
	for id in ${directprint_right}; do \
		./build/build_angular.sh right $$id; \
		env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64; \
		ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/directprint/${VERSION}/$$id"; \
		ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/directprint/current/$$id"; \
		scp dist/asta-copyclient*.deb ${deploy_user}@${deploy_host}:${dist_folder}/directprint/${VERSION}/$$id/asta-copyclient.deb; \
		ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/directprint/${VERSION}/$$id/asta-copyclient.deb ${dist_folder}/directprint/current/$$id/asta-copyclient.deb"; \
	done

build-kiosk:
	./build/change_config.sh enable_kiosk
	./build/change_config.sh enable_starthidden
	./build/change_config.sh build_only_deb
	-@rm -rf dist 2>/dev/null || true
	./build/build_angular.sh
	env SHELL=bash ./node_modules/.bin/electron-builder --linux --x64
	ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/kiosk/${VERSION}"
	ssh ${deploy_user}@${deploy_host} "mkdir -p ${dist_folder}/kiosk/current"
	scp dist/asta-copyclient*.deb ${deploy_user}@${deploy_host}:${dist_folder}/kiosk/${VERSION}/asta-copyclient_${VERSION}.deb
	ssh ${deploy_user}@${deploy_host} "ln -sf ${dist_folder}/kiosk/${VERSION}/asta-copyclient_${VERSION}.deb ${dist_folder}/kiosk/current/asta-copyclient.deb"
