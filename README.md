# Monitool

Monitool is an indicator monitoring application for humanitarian organisations.

It is composed by
- A REST API, made with NodeJS
- A single page application, made with Angular 1

## Dependencies

External dependencies that should be pre-installed are:

- NodeJS (https://nodejs.org)
- CouchDB (http://couchdb.apache.org)
- A webserver, to act as a reverse proxy, and handle HTTPS. Nginx recommended!

All others dependencies can be installed by using the adapted package managers

- NPM, built-in with NodeJS, for the API's dependencies
- Bower, for the client site dependencies (https://bower.io/)


## Installation

We assume in this manual than:

- Your virtual machine is reachable at `monitool.yourorganization.com`.
- You are using a debian based distribution.
- Your name is "John Doe" (please, do not leave default password).

Also
- You must have a working firewall that does not accept incoming connections to
	- CouchDB (port: 5984)
	- Monitool (port: 8000)

### Installing NodeJS

Do not use the version from your package manager.

Refer to https://nodejs.org/en/download/package-manager/ to install the stable version.


### Installing CouchDB

We can simply use the version from the package manager.
	
	# Install couchdb
	> sudo apt install couchdb

	# Create databases needed by Monitool to work
	> curl -X PUT http://localhost:5984/monitool-documents
	> curl -X PUT http://localhost:5984/monitool-sessions

	# Set up administrator account to get out of CouchDB "admin party"
	# Leave the quote as they are in this example, it is not a mistake.
	> curl -X PUT http://localhost:5984/_config/admins/johndoe -d '"jdpassword"'

### Installing NGINX

This configuration is for HTTP only.

Get a proper certificate and set it up in NGINX for a production server. Passwords and session cookies will be unencrypted in transit otherwise.

	# Install the distribution package
	> sudo apt install nginx

	# Edit configuration to have a reverse proxy to port 80
	> vi /etc/nginx/sites-enabled/default
	server {
		listen 80;

		server_name monitool.yourorganization.com;	

		location / {
			proxy_pass http://localhost:8000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection 'upgrade';
			proxy_set_header Host $host;
			proxy_cache_bypass $http_upgrade;
		}
	}

	# Restart service
	> sudo systemctl restart nginx.service


### Installing Monitool

We assume that NodeJS is already installed and running.

	# Install Bower and Gulp-cli globally, to have them in the PATH
	> sudo npm install --g bower gulp-cli

	# Clone the repository and enter the folder
	> git clone git@github.com:medecins-du-monde/monitool.git
	> cd monitool

	# Install all dependencies needed by Monitool's API
	> npm install

We now need to create a configuration file

	# Copy the reference file
	> cp config-template.json config.json
	
	# Change document as following
	> vi config.json
	{
		"debug": false,
		"port": 8000,
		"home": "http://monitool.yourorganization.com/",
		"couchdb": {
			"url": "http://localhost:5984",
			"bucket": "monitool-documents",
			"host": "localhost",
			"sessionBucket": "monitool-sessions",
			"username": null,
			"password": null
		},
		"oauth": {
			"authUrl": "https://login.windows.net/<get this from azure>/oauth2/authorize",
			"tokenUrl": "https://login.windows.net/<get this from azure>/oauth2/token",
			"clientId": <get this from azure>,
			"clientSecret": <get this from azure>,
			"callbackUrl": "http://monitool.yourorganization.com/authentication/login-callback",
			"resource": "https://graph.windows.net"
		}
	}


The last step is to build release files, and configure the database

	# Build all javascript release files
	> gulp build

	# Configure the database
	> gulp design-docs

### Installing monitool as a service (only for production server)

An easy way to install a NodeJS application as a service is to use pm2.

FIXME


## Running Monitool

### On a development machine

Simply run the app.js file with nodejs

	> pwd
	/home/xyz/Projects/monitool
	> node ./server/app.js --dev


### On a production machine

Monitool is installed as a service, and already running.

