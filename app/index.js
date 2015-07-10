/**
 * ...
 * @author Colin Richardson
 */

var https = require("https"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	headerLinkReg = /<(.+?)>; rel="(.+?)"/g;

function GitHubAPI(initData) {
	init.call(this, initData || {});
}

function init(initData) {
	if ( util.isString(initData.token) || util.isUndefined(initData.token) ) {
		this._token = initData.token;
	} else {
		throw Error("token must be String or undefined");
	}
	if ( util.isUndefined(initData.debug) || util.isBoolean(initData.debug) ) {
		this._debug = initData.debug;
	} else {
		throw Error("debug must be Boolean or undefined");
	}
}

function getOptions(method, path) {
	path = path.replace("https://api.github.com", "");
	var options = {
		"host": "api.github.com",
		"port": 443,
		"path": path,
		"method": method,
		"headers": {
			"host": "api.github.com",
			"content-length": "0",
			"user-agent": "NodeJS HTTPS Client",
			"accept": "application/vnd.github.v3+json"
		}
	};
	if ( this._token ) {
		options.headers.authorization = "token " + this._token;
	}
	return options;
}

function processHeaders(headers) {
	if ( "link" in headers ) {
		headers.link = processHeaderLink(headers.link);
	}
	return headers;
}

function processHeaderLink(link) {
	var linkObj = {};
	while ( (match = headerLinkReg.exec(link)) != null ) {
		linkObj[match[2]] = match[1];
	}
	return linkObj;
}

GitHubAPI.prototype.get = function (path) {
	var httpsOptions = getOptions.call(this, "get", path),
		emitter = new EventEmitter();
	
	setImmediate(function () {
		if ( this._debug ) {
			console.log("url:", require("url").format(httpsOptions.path));
		}
		https.request(httpsOptions, function (res) {
			var data = "";
			res.on("data", function (chunk) {
				data += chunk;
			}).on("end", function () {
				res.data = JSON.parse(data);
				res.headers = processHeaders(res.headers);
				emitter.emit("end", res);
				emitter.removeAllListeners();
			});
		}).end();
	});
	return emitter;
};

GitHubAPI.prototype.getAll = function (path) {
	var arrRes = [], arrData = [], api = this,
		emitter = new EventEmitter();
		
	setImmediate(function () {
		api.get(path).on("end", onRes);
	});
	
	function onRes (res) {
		arrRes.push(res);
		if ( Array.isArray(res.data) ) {
			arrData = arrData.concat(res.data);
		} else {
			arrData.push(res.data);
		}
		if ( res.headers && res.headers.link && res.headers.link.next ) {
			api.get(res.headers.link.next).on("end", onRes);
		} else {
			arrRes.data = arrData;
			emitter.emit("end", arrRes);
			emitter.removeAllListeners();
		}
	}
	return emitter;
};

GitHubAPI.prototype.post = function (path, data) {
	var httpsOptions = getOptions.call(this, "post", path),
		emitter = new EventEmitter();
	
	if ( util.isObject(data) ) {
		data = JSON.stringify(data);
	}
	
	setImmediate(function () {
		if ( this._debug ) {
			console.log("url:", require("url").format(httpsOptions.path), "data:", data);
		}
		https.request(httpsOptions, function (res) {
			var data = "";
			res.on("data", function (chunk) {
				data += chunk;
			}).on("end", function () {
				res.data = JSON.parse(data);
				res.headers = processHeaders(res.headers);
				emitter.emit("end", res);
				emitter.removeAllListeners();
			});
		}).write(data).end();
	});
	return emitter;
};

GitHubAPI.init = function (initData) {
	return new GitHubAPI(initData);
};

module.exports = GitHubAPI;