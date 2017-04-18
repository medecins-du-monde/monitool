# Monitool installation guide

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

	# Set up administrator account to get out of CouchDB "admin party"
	# Leave the quote as they are in this example, it is not a mistake.
	> curl -X PUT http://localhost:5984/_config/admins/johndoe -d '"jdpassword"'

### Installing NGINX

This configuration is for HTTP only.

Please use HTTPS in a production server, as partners will log in monitool using a password, which should not transit in clear text over the network.

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

	# Clone the repository and enter the folder
	> git clone git@github.com:medecins-du-monde/monitool.git
	> cd monitool

We now need to create a configuration file

	# Copy the reference file
	> cp config-template.json config.json
	
	# Change document as following
	> vi config.json
	{
		// Putting debug = true will prevent using the minified files for frontend,
		// disable compression, and expose error data to users.
		// Never use in a production server.
		"debug": false,

		// do not put a trailing slash here
		"baseUrl": "http://monitool.yourorganization.com",

		// Use the same port as in the reverse proxy configuration
		"port": 8000,

		// Database configuration
		"couchdb": {
			"host": "localhost",
			"port": 5984,
			
			// Call those bucket as you wish, but don't use the same bucket for
			// documents and sessions.
			"bucket": "monitool",
			"sessionBucket": "monitool-sessions",

			// This user accounts comes from the previous step ("installing database").
			"username": "johndoe",
			"password": "jdpassword"
		},
		"api": {
			// This API key will be used to translate indicator definitions in the settings
			// page of monitool.
			// If not needed, it can be left blank (but automatic translations won't work)
			"google": "[enter google translate api key here]"
		},
		"auth": {
			// If your email account is myaccount@yourorganisation.com
			// this line will give your account administrative priviledge
			"administrator": "myaccount",

			// Define at most one provider in a production server
			"providers": {
				// Use AzureAD accounts
				"azureAD": {
					"label": "Use MDM account",
					"domain": "medecinsdumonde.net",

					// Get those from https://azure.microsoft.com
					"clientId": "[enter client id]",
					"clientSecret": "[enter client secret]"
				},

				// Training accounts when enabled, allow to log in with
				// an administrator account without password.
				"training": {
					"label": "Use training account (admin)",
					"account": "romain.gilliotte"
				}
			}
		}
	}

Install dependencies, and build the app

	# Install all dependencies needed by Monitool's backend
	> npm install

	# Install dependencies and build application for the frontend
	> ./node_modules/.bin/gulp build


### Install monitool as a service (only for production server)

An easy way to install a NodeJS application as a service is to use pm2.

install pm2

	sudo npm install pm2 -g
	
Run this command to run your application as a service by typing the following:

	sudo env PATH=$PATH:/usr/local/bin pm2 startup  -u USER --hp /home/USER/
	sudo chmod 0644 /etc/systemd/system/pm2-USER.service
	sudo vim /etc/systemd/system/pm2-USER.service
	
delet line

	Type=forking
	
start app

	pm2 start monitool/config.json
	pm2 save
	
enable on boot

	sudo systemctl enable pm2-USER
	
FIXME
