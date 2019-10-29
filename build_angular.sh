#!/bin/bash
if [[ ! -z "$1" ]]; then
	if [[ ! -z "$2" ]]; then
		if [[ "$1" == "left" ]]; then
			leftPrinter=$2
		elif [[ "$1" == "right" ]]; then
			rightPrinter=$2
		elif [[ "$1" == "both" ]]; then
			leftPrinter=$2
			rightPrinter=$3
		fi
	fi
fi

rm -rf web
cd src
cp build.yaml /tmp/build.yaml.orig
sed -ne :1 -e 'N;1,2b1' -e 'P;D' build.yaml > /tmp/build.yaml
mv /tmp/build.yaml build.yaml
echo "           - -DleftPrinter=$leftPrinter" >> build.yaml
echo "           - -DrightPrinter=$rightPrinter" >> build.yaml
make build
mv /tmp/build.yaml.orig build.yaml
mkdir -p ../web
cp -R build/* ../web/
cp -R ../includes/*.js ../web/
cp -R ../includes/locales ../web/
