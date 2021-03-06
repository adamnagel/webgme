# Installation

See the [Installation](INSTALLATION.md) guide.

# Program usage

All runnable javascript programs are stored in the bin directory, you should start them with node, e.g. `node bin/eServer.js`. 
Each script supports the `-help` command line parameter which will list all possible parameters.

* eServer: it start a webserver which open a data connection towards the configured mongoDb and functions as a webgme server as well.
* getconfig: creates a `config.js` local configuration file which can be used to overwrite the default configuration values in the `getconfig.js` (all command uses these configurations)  
* parse_xme: parses a gme classic xme file and inports it into a webgme database.
* database_info: prints out the projects and branches stored on the given database.
* serialize_to_xml: creates a classic gme xme file from the given webgme project
* update_project: updates the given branch of a project to the latest version of webGME. this ensures that all new functions will be available without negatively affecting already made data.

# Library usage

You can get all core functionality (not related to the GUI) by using node import `require('webgme')`, or get specific part of the library 
using requirejs (see the scripts in the bin directory). 

``` 
	var webGME = require('webgme');
	var storage = new webGME.clientStorage({'type':'node'}); //other parameters of config can be override here as well, but this must be set
	storage.openDatabase(function(err){
		if(!err) {
		    storage.openProject(function(err,project){
		        if(!err){
		            var core = webGME.core(project); //for additional options check the code
		        }
		    }
		}
	});
```
