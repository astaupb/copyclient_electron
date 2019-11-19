#!/bin/bash
cd -P -- "$(dirname -- "$0")"/..

# inject our stuff into the HTML
if [[ "$(uname)" == *Darwin* ]]; then
	sed=gsed
else
	sed=sed
fi

if [[ ! -z "$1" ]]; then
	if [[ "$1" == "enable_kiosk" ]]; then
		$sed -i "s/_kiosk = false/_kiosk = true/g" includes/config.js
	fi
	if [[ "$1" == "disable_kiosk" ]]; then
		$sed -i "s/_kiosk = true/_kiosk = false/g" includes/config.js
	fi
	if [[ "$1" == "enable_starthidden" ]]; then
		$sed -i "s/_startHidden = false/_startHidden = true/g" includes/config.js
	fi
	if [[ "$1" == "disable_starthidden" ]]; then
		$sed -i "s/_startHidden = true/_startHidden = false/g" includes/config.js
	fi
	if [[ "$1" == "build_all_linux" ]]; then
		tmp=$(mktemp)
		jq '.build.linux.target = [ "deb", "rpm", "pacman", "snap", "tar.gz" ]' package.json | unexpand -t2 > $tmp
		mv $tmp package.json
	fi
	if [[ "$1" == "build_only_deb" ]]; then
		tmp=$(mktemp)
		jq '.build.linux.target = [ "deb" ]' package.json | unexpand -t2 > $tmp
		mv $tmp package.json
	fi
fi