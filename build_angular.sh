#!/bin/bash
if [[ ! -z "$1" ]]; then
	if [[ ! -z "$2" ]]; then
		if [[ "$2" == "left" ]]; then
			leftPrinter=$1
		elif [[ "$2" == "right" ]]; then
			rightPrinter=$1
		fi
	fi
fi

rm -rf web
cd src
cp build.yaml /tmp/build.yaml.orig
head -n -2 build.yaml > /tmp/build.yaml
mv /tmp/build.yaml build.yaml
echo "           - -DleftPrinter=$leftPrinter" >> build.yaml
echo "           - -DrightPrinter=$rightPrinter" >> build.yaml
pub get
webdev build
mv /tmp/build.yaml.orig build.yaml
mkdir -p ../web
cp -R build/* ../web/
cp -R ../includes/*.js ../web/
cp -R ../includes/locales ../web/
