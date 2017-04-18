# Monitool

Monitool is an indicator monitoring application for humanitarian organisations.

It is composed by
- A REST API, made with NodeJS
- A single page application, made with Angular 1

A demo version can be seen at http://monitool-training.medecinsdumonde.net

## Dependencies

External dependencies that should be pre-installed are:

- NodeJS (https://nodejs.org)
- CouchDB (http://couchdb.apache.org)
- A webserver, to act as a reverse proxy, and handle HTTPS. Nginx recommended!

All others dependencies can be installed by using the adapted package managers

- NPM, built-in with NodeJS, for the API's dependencies
- Bower, for the client site dependencies (https://bower.io/)

## Installing Monitool

Have a look at the [Installation guide](INSTALL.md).

## Running Monitool

On a developement machine, follow the installation guide, and simply run the monitool.js file

	> ./bin/monitool.js --dev

## Running unit tests

	> npm run-script test-client
	> npm run-script test-server
