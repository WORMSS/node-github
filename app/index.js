/**
 * ...
 * @author Colin Richardson
 */

var https = require("https"),
	EventEmitter = require("events").EventEmitter,
	headerLinkReg = /<(.+?)>; rel="(.+?)"/g;

function GitHubAPI(initData) {
	init.call(this, initData || {});
}

function init(initData) {
	this._token = initData.token || undefined;
	this._debug = initData.debug || false;
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

GitHubAPI.prototype.get = function (path, cb) {
	var httpsOptions = getOptions.call(this, "get", path),
		emitter = new EventEmitter();
	
	setImmediate(function () {
		if ( this._debug ) {
			console.log("url:", require('url').format(httpsOptions.path));
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

GitHubAPI.prototype.getAll = function (path, cb) {
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

module.exports = GitHubAPI;