# Monitool

Monitool is an indicator monitoring application for humanitarian organisations built around 2015, and regulary updated from user feedback since.
It is used to follow the international programs of Medecins du Monde France.

A demo version can be seen at http://monitool-training.medecinsdumonde.net

It is composed by
- A REST API, made with NodeJS and backed up with CouchDB 1
- A single page application, made with Angular 1

As medecins du monde uses Azure Active Directory as a platform for SSO, user authentication is delegated using OAuth2.

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
	MONITOOL_COUCHDB_SESSIONBUCKET
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

## Docker

Monitool uses docker both for development and deployment.

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

To run monitool on a production server use the prebuilt images on Docker Hub.

	wget https://raw.githubusercontent.com/medecins-du-monde/monitool/master/docker/compose-production.yml

	printf "your-azuread-client-id" | docker secret create azuread_clientid -
	printf "your-azuread-client-secret" | docker secret create azuread_clientsecret -
	printf "your-google-translate-api-key" | docker secret create googletranslate_apikey -
	printf "a-long-random-string" | docker secret create monitool_cookiesecret -
	printf "another-random-string" | docker secret create monitool_dbpassword -

	docker stack deploy -c compose-production.yml monitool-prod
