/*
 * Copyright (C) 2012 Vanderbilt University, All rights reserved.
 * 
 * Author: Miklos Maroti
 */

define(
[ "core/assert", "core/lib/sax", "fs", "core/core3", "core/config", "core/util", "core/cache" ],
function (ASSERT, SAX, FS, Core, CONFIG, UTIL, Cache) {
	"use strict";

	var ID = "id";
	var IDREF = "idref";
	var IDREFS = "idrefs";

	var DTD = {
		folder: {
			id: ID
		},
		model: {
			id: ID,
			derivedfrom: IDREF
		},
		atom: {
			id: ID,
			derivedfrom: IDREF
		},
		reference: {
			id: ID,
			derivedfrom: IDREF,
			referred: IDREF
		},
		set: {
			id: ID,
			derivedfrom: IDREF,
			members: IDREFS
		},
		connection: {
			id: ID,
			derivedfrom: IDREF
		},
		connpoint: {
			target: IDREF,
			refs: IDREFS
		}
	};

	return function (storage, filename, callback) {
		ASSERT(storage && filename && callback);

		var ids = {};
		var idCount = 0;

		var unresolved = [];

		var timerhandle = setInterval(function () {
			console.log("  at line " + parser._parser.line + " (" + total + " xml objects, "
			+ idCount + " ids, " + unresolved.length + " idrefs)");
		}, CONFIG.parser.reportingTime);

		var core = new Core(new Cache(storage), {
			autopersist: true
		});

		var exit = function (err, result) {
			if( timerhandle ) {
				clearInterval(timerhandle);
				timerhandle = undefined;
			}

			if( callback ) {
				callback(err, result);
				callback = undefined;
			}
		};

		var tags = [];

		var finishParsing = function (err) {
			if( err ) {
				exit(err);
			}
			else {
				core.persist(tags[0].node, function (err) {
					if( err ) {
						exit(err);
					}
					else {
						var key = core.getKey(tags[0].node);

						console.log("Parsing done (" + total + " xml objects, " + idCount
						+ " ids, " + unresolved.length + " idrefs)");
						console.log("Root key = " + key);

						tags = null;
						core = null;

						exit(null, key);
					}
				});
			}
		};

		var total = 0;

		var addTag = function (tag) {

			var node = core.createNode(tags.length === 0 ? null : tags[tags.length - 1].node);

			var hasIdrefs = false;
			for( var key in tag.attributes ) {
				var value = tag.attributes[key];
				core.setAttribute(node, key, value);

				var type = (DTD[tag.name] || {})[key];
				if( type === ID ) {
					ASSERT(ids[value] === undefined);

					ids[value] = core.getStringPath(node);
					++idCount;
				}
				else if( type === IDREF || type === IDREFS ) {
					hasIdrefs = true;
				}

				if( key === "id" && type !== ID ) {
					console.log("ID not defined in DTD", tag.name, value, type);
				}
			}

			if( hasIdrefs ) {
				unresolved.push(core.getStringPath(node));
			}

			core.setAttribute(node, "#tag", tag.name);

			tag.text = "";
			tag.node = node;

			++total;
			tags.push(tag);
		};

		addTag({
			name: "Root",
			attributes: {
				created: (new Date()).toString()
			}
		});

		var parser = SAX.createStream(true, {
			trim: true
		});

		parser.on("opentag", addTag);

		parser.on("closetag", function (name) {
			ASSERT(tags.length >= 2);

			var tag = tags.pop();
			ASSERT(tag.name === name);

			if( tag.text !== "" ) {
				core.setAttribute(tag.node, "#text", tag.text);
			}
		});

		parser.on("text", function (text) {
			if( tags.length !== 0 ) {
				var tag = tags[tags.length - 1];
				tag.text += text;
			}
		});

		parser.on("error", function (err) {
			exit("Unknown parser error: " + JSON.stringify(err));
		});

		parser.on("end", function () {
			if( timerhandle ) {
				clearInterval(timerhandle);
			}
			console.log("Waiting for remaining objects to be saved ...");

			ASSERT(tags.length === 1);

			core.persist(tags[0].node, function (err) {
				if( err ) {
					exit(err);
				}
				else {
					root = tags[0].node;
					resolveUnresolved(finishParsing);
				}
			});
		});

		var root;
		var resolveLoadByPath = function (path, callback) {
			core.loadByPath(root, path, function (err, node) {
				UTIL.immediateCallback(callback, err, node);
			});
		};

		var resolveAddPointer = function (source, name, targetPath, callback) {
			ASSERT(typeof name === "string" && typeof targetPath === "string"
			&& callback instanceof Function);

			resolveLoadByPath(targetPath, function (err, target) {
				if( err ) {
					callback(err);
				}
				else {
					core.setPointer(source, name, target);
					UTIL.immediateCallback(callback, null);
				}
			});
		};

		var resolveReferences = function (path, callback) {
			ASSERT(typeof path === "string" && callback instanceof Function);

			resolveLoadByPath(
			path,
			function (err, node) {
				if( err ) {
					exit(err);
				}
				else {

					var join = new UTIL.AsyncJoin(callback);

					var tag = core.getAttribute(node, "#tag");
					var names = core.getAttributeNames(node);

					var targetId, targetPath;

					for( var i = 0; i < names.length; ++i ) {
						var name = names[i];
						var type = (DTD[tag] || {})[name];
						if( type === IDREF ) {
							targetId = core.getAttribute(node, name);
							targetPath = ids[targetId];
							if( targetPath === undefined ) {
								console.log("Missing id " + targetId);
							}
							else {
								resolveAddPointer(node, name, targetPath, join.add());
							}
						}
						else if( type === IDREFS ) {
							targetId = core.getAttribute(node, name);
							ASSERT(typeof targetId === "string");

							targetId = targetId === "" ? [] : targetId.split(" ");
							for( var j = 0; j < targetId.length; ++j ) {
								targetPath = ids[targetId[j]];
								if( targetPath === undefined ) {
									console.log("Missing id " + targetId[j]);
								}
								else {
									resolveAddPointer(node, name + "-" + j, targetPath, join.add());
								}
							}
						}
					}

					join.wait();
				}
			});
		};

		var resolveUnresolved = function (callback) {
			ASSERT(callback instanceof Function);

			console.log("Resolving " + unresolved.length + " objects with idrefs ...");

			var done = 0;
			var index = 0;
			var next = function (err) {
				if( done < unresolved.length ) {
					if( err ) {
						done = unresolved.length;
						callback(err);
					}
					else if( ++done === unresolved.length ) {
						ASSERT(index === done);
						UTIL.immediateCallback(callback, null);
					}
					else if( index < unresolved.length ) {
						var path = unresolved[index++];
						resolveReferences(path, next);
					}
				}
			};

			timerhandle = setInterval(function () {
				console.log("  at object " + index + " out of " + unresolved.length);
			}, CONFIG.parser.reportingTime);

			// resolve concurrently
			for( var i = 0; i < 50 && done < unresolved.length; ++i ) {
				--done;
				next(null);
			}

			if( unresolved.length === 0 ) {
				callback(null);
			}
		};

		var stream = FS.createReadStream(filename);

		stream.on("error", function (err) {
			exit(err.code === "ENOENT" ? "File not found: " + filename : "Unknown file error: "
			+ JSON.stringify(err));
		});

		stream.on("open", function () {
			console.log("Parsing xml file ...");
			stream.pipe(parser);
		});
	};
});
