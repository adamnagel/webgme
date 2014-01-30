# Installation#

## OS-X ##

### Dependencies ###

#### Node.js ####
**Ubuntu**: 

Because the version you get by default from **apt-get** is too old for WebGME, you must take the steps below.

```
sudo apt-get update
sudo apt-get install -y python-software-properties python g++ make
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs
```

**OSX**:

```
brew install node
```

#### MongoDB ####
**Ubuntu**:

```
sudo apt-get install mongodb
```

**OSX**:

1. Install:
	
	```
	brew install mongodb
	```

2. Have **launchd** start **MongoDB** at login:

	```
	ln -sfv /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents
	```

3. Then, load **MongoDB** right now:

	```
	launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist
	```

#### Git ####

**Ubuntu**:

```
sudo apt-get install git
```

### Setup ###

First, download WebGME:

```
git clone https://github.com/webgme/webgme.git
```

Then, navigate to the `webgme` directory and install **webgme**:

```
npm install
```

Create a blank `config.js` file by running:

```
node bin/getconfig.js
```

Customize `config.js` for your installation. A good starting point:

```	
define([], function () {
	"use strict";
   	return {
		host: '127.0.0.1',
		port: 80,
		project: "test",
		autorecconnect: true,
		reconndelay: 1000,
		reconnamount: 1000,
		autostart: false,
		//used by the server
		loglevel: 2, // 5 = ALL, 4 = DEBUG, 3 = INFO, 2 = WARNING, 1 = ERROR, 0 = OFF
		logfile: 'server.log',
		mongoip: "127.0.0.1",
		mongoport: 27017,
		mongodatabase: "multi",
		authentication: false,
		httpsecure: false,
		guest: false,
		sessioncookieid : 'webgmeSid',
		sessioncookiesecret : 'meWebGMEez'
	};
});
```

### Run ###
Start **webgme**:

```
sudo node bin/eServer.js
```

Visit your website (http://host:port) from a browser