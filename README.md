# Monitool

Monitool is an indicator monitoring application for humanitarian organisations built around 2014-2015, and regulary updated from user feedback since.

It is used to follow the indicators of most international programs as well as few domestic programs of Medecins du Monde France.

A demo version can be seen at http://monitool-training.medecinsdumonde.net (no account is required to login).

# About the code

## API

The API is a NodeJS daemon which was originally written with express.js and used CouchDB 1 as database.

Chosing CouchDB was convenient as in-situ training were made on the field, without internet access, and CouchDB allows easy replication to be used with a local server, which then could be synchronized with the production database when the training was over.

The code was later ported to ES7, Koa and CouchDB 2.0.

- Async/await syntax everywhere.
- Model validation is performed with `is-my-json-valid` and some custom code.
- User authentication is performed with `passport`, specifically for Azure Active Directory (OAuth2).
- PDF generation is enabled by `pdfmake`.
- Document versionning is performed by using `fast-json-patch` wich generates RFC-6902 patches.
- The API also depends on an external npm modules created specifically for Monitool: `timeslot-dag`

## Frontend

The whole frontend application is a single page application made with AngularJS.
It is built and served by an nginx reverse proxy.

The main dependencies are:

- `bootstrap-css` for all the templating
- `ui-bootstrap` for modals, datepickers, dropdowns...
- `handsontable` for Excel-like data entry
- `c3` for graphs.
- `axios` for API queries
- `ui-router` for routing.


Monitool was originally written in AngularJS 1.2 using `gulp` tasks for packing.

It was then updated to use ES7, compiling with webpack and BabelJS.
The project currently uses the last AngularJS version (1.7), and was fully refactored to be component based.

To ease a possible future transition out of AngularJS the following conditions were respected:

- All component bindings are 'one-way' (`<` or `&`): the project can be migrated to a framework that does not support 2-way data bindings (React, Vue, ...).
- ES6 imports are used everywhere where possible, instead of AngularJS dependency injection.
- Exactly one component by angular module.
- No longer use AngularJS services, factories, $http, $resource, ...

As AngularJS will be maintained until July 2021, porting the frontend to another framework was not considered a priority as of today.


## Docker

Originally, the NodeJS daemon was in charge of serving the gzipped static files, and used an in-memory cache to speed up request.
This allowed having to start only two services to start the complete application (NodeJS app and CouchDB).

To reduce the amount of code that need to be maintained, the cache was moved to a Redis instance, and the static files are now served from an nginx reverse proxy. Assets are compressed with brotli and gzip at compile time.

Docker was introduced to make the transition easier and not having to install and update the services separately.

# Install & Run

## Configuration

Monitool's API takes the following configuration keys:

	debug:				Enable/Disable stacktrack on API errors [default=false]
	baseUrl:			Used for redirecting user after 3rd party authentication [default=http://localhost:8000]
	port:				Binded port for the API [default=8000]
	cookieSecret:		Secret to encrypt the cookies [no_default]

	couchdb.host		Self-explanatory [default=localhost]
	couchdb.port		Self-explanatory [default=5984]
	couchdb.dataBucket	Self-explanatory [default=monitool]
	couchdb.user		Self-explanatory [default=]
	couchdb.pass		Self-explanatory [default=]

	api.google			API key that allows using Google Translate API. Used to create cross-cutting indicators [no_default]

	auth.administrator	Login of account that will always be an admin, disregarding entry in database.

	auth.providers.azuread.label
	auth.providers.azuread.domain
	auth.providers.azuread.clientid
	auth.providers.azuread.clientsecret

	auth.providers.training.label
	auth.providers.training.account

### Development

To develop on Monitool, no need to install NodeJS or CouchDB.

To start a local instance:

	# Assuming docker is installed.

	# Clone the repo and go to the working directory
	git clone git@github.com:medecins-du-monde/monitool.git
	cd monitool

	# Configure docker
	docker swarm init
	printf "your-google-translate-api-key" | docker secret create googletranslate_apikey -

	# Start up all the containers.
	docker stack deploy -c docker/compose-develop.yml monitool-dev

Both frontend and server source folders are binded from your filesystem: the frontend and backend code will autoreload when changes are made to the sources.

### Production

To run monitool on a production server no need to clone the repo and compile on the host.
Prebuilt images are available on Docker Hub.

The compose files available on the repository are for small deployment, keeping all containers in the same host.

	wget https://raw.githubusercontent.com/medecins-du-monde/monitool/master/docker/compose-production.yml
	wget https://raw.githubusercontent.com/medecins-du-monde/monitool/master/docker/nginx.conf
	wget https://raw.githubusercontent.com/medecins-du-monde/monitool/master/docker/redis.conf

	printf "your-azuread-client-id" | docker secret create azuread_clientid -
	printf "your-azuread-client-secret" | docker secret create azuread_clientsecret -
	printf "your-google-translate-api-key" | docker secret create googletranslate_apikey -
	printf "a-long-random-string" | docker secret create monitool_cookiesecret -

	docker stack deploy -c compose-production.yml monitool-prod
