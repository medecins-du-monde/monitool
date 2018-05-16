# Monitool

Monitool is an indicator monitoring application for humanitarian organisations built around 2014-2015, and regulary updated from user feedback since.

It is used to follow the international programs of Medecins du Monde France.

A demo version can be seen at http://monitool-training.medecinsdumonde.net (no account is required to login).

# About the code

## API

The API is a NodeJS daemon which uses CouchDB 1 as database.

It originally written with express.js, but was ported to Koa to make the code easier to read.

- Uses async/await syntax everywhere.
- Model validation is performed with `is-my-json-valid` and some custom code.
- User authentication is performed with `passport`, specifically for Azure Active Directory (OAuth2).
- PDF generation is enabled by `pdfmake`.
- Document versionning is performed by using `fast-json-patch` wich generates RFC-6902 patches.
- The API also depends on two external npm modules that were created specifically for Monitool: `timeslot-dag` and `olap-in-memory`.

## Frontend

Besides the login page, the whole frontend application is a SPA made with AngularJS.

The main dependencies are:

- `bootstrap-css` for all the templating
- `ui-bootstrap` for modals, datepickers, dropdowns...
- `handsontable` for Excel like data entry
- `c3` for graphs.
- `axios` for API queries (AngularJS `$http` is not used anymore, as to reduce the amount of DI).


Monitool was originally written in Angular 1.2 using `gulp` tasks for packing, and then updated to further AngularJS versions.

The project currently uses the last AngularJS version (1.7), and was refactored to be component based, to ease a possible future transition out of AngularJS.

All component bindings are 'one-way' (`<`), so it should be possible to migrate the project easily to a framework that does not support two-way data bindings with a reasonable amount of work (React, Vue, ...).

Changes include:

- Use the new `angular.component()` API everywhere, instead of `angular.controller()`
- Build with `webpack`
- Reducing the AngularJS Dependency Injection (ES6 imports).
- Declaring one component by angular module.


## Docker

Originally, the NodeJS daemon was in charge of serving the gzipped static files, and used an in-memory cache to speed up request.
This allowed having to start only two services to start the complete application (NodeJS app and database).

To reduce the amount of code that need to be maintained, the cache was moved to a redis instance, and the static files are now served from an nginx reverse proxy. Assets are compressed with brotli and gzip by webpack.

Docker was introduced to make the transition easier and not having to start the 4 services manually.

As the application is small, and not expecting much traffic, Docker Swarm was used in place of Kubernetes: the 4 containers that are needed to run the application can easily be deployed on a small cloud node (< 512MB RAM).

# Install & Run

## Configuration

Monitool is configured by using environment variables.

	MONITOOL_DEBUG
	MONITOOL_BASE_URL
	MONITOOL_PORT
	MONITOOL_COOKIE_SECRET
	MONITOOL_COOKIE_SECRET_FILE

	MONITOOL_COUCHDB_HOST
	MONITOOL_COUCHDB_PORT
	MONITOOL_COUCHDB_DATABUCKET
	MONITOOL_COUCHDB_USER
	MONITOOL_COUCHDB_USER_FILE
	MONITOOL_COUCHDB_PASS
	MONITOOL_COUCHDB_PASS_FILE
	MONITOOL_API_GOOGLE
	MONITOOL_API_GOOGLE_FILE
	MONITOOL_AUTH_ADMINISTRATOR

	MONITOOL_AUTH_PROVIDERS_AZUREAD
	MONITOOL_AUTH_PROVIDERS_AZUREAD_LABEL
	MONITOOL_AUTH_PROVIDERS_AZUREAD_DOMAIN
	MONITOOL_AUTH_PROVIDERS_AZUREAD_CLIENTID
	MONITOOL_AUTH_PROVIDERS_AZUREAD_CLIENTID_FILE
	MONITOOL_AUTH_PROVIDERS_AZUREAD_CLIENTSECRET
	MONITOOL_AUTH_PROVIDERS_AZUREAD_CLIENTSECRET_FILE

	MONITOOL_AUTH_PROVIDERS_TRAINING
	MONITOOL_AUTH_PROVIDERS_TRAINING_LABEL
	MONITOOL_AUTH_PROVIDERS_TRAINING_ACCOUNT

### Development

To develop on monitool, the first step is to [install docker](https://docs.docker.com/install/).

You'll need to start a swarm (a single small node is enough to host everything), clone the repository, and set up a docker secret.

	# Clone the repo and go to the working directory
	git clone git@github.com:medecins-du-monde/monitool.git
	cd monitool

	# Configure docker
	docker swarm init
	printf "your-google-translate-api-key" | docker secret create googletranslate_apikey -

To run the app run `docker stack deploy -c docker/compose-develop.yml monitool-dev`

To stop it `docker stack rm monitool-dev`

Both client and server side source folders are binded in the containers from your filesystem.

Editing the sources will will automatically rebuild bundle and restart the API.

### Production

To run monitool on a production server no need to clone the repo and compile on the host.
Up-to-date and prebuilt images are available on Docker Hub.

	wget https://raw.githubusercontent.com/medecins-du-monde/monitool/master/docker/compose-production.yml

	printf "your-azuread-client-id" | docker secret create azuread_clientid -
	printf "your-azuread-client-secret" | docker secret create azuread_clientsecret -
	printf "your-google-translate-api-key" | docker secret create googletranslate_apikey -
	printf "a-long-random-string" | docker secret create monitool_cookiesecret -
	printf "another-random-string" | docker secret create monitool_dbpassword -

	docker stack deploy -c compose-production.yml monitool-prod
