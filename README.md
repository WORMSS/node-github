# node-github
Simple Github API

### API:
##### Contructor Arguments
* initData **[Object|undefined]**. *Object with the following properties*
  * token **[String|undefined]**. *OAuth token key. If falsable, api works in public mode.*
  * debug **[Boolean|undefined]**. *If true, path and return codes are output to the screen.*

##### get
* path **[String]**. *The path of the github endpoint. Can be either short* **"/user"** *or full* **"https://api.github.com/user".**

##### getAll
* path **[String]**. *The path of the github endpoint. Can be either short* **"/user/repos"** *or full* **"https://api.github.com/user/repos"**. *It is recommended to add* **"?per_page=100"** *to reduce the amount of calls needed.*

### Usage:
#### Constructing
````javascript
// standard way
var GitHubAPI = require('@wormss/github');
var github = new GitHubAPI({ "token": "abcdef123456", "debug": false });
````
````javascript
// quick instance with arguments
var github = require('@wormss/github').init({ "token": "abcdef123456", "debug": false });
````
#### Get - Single
````javascript
// Single shot response.
var path = "/user";
github.get(path).on("end", function (res) {
	// res is standard https response object.
	console.log(res.statusCode);
	
	// link header is upgraded to an object with rel as property name;
	console.log(res.headers.link); // { "next": "...", "last": "...", "first": "...", "prev": "..." }
	
	// not apart of standard https standard response.
	// 'data' holds the json parsed body of the response.
	console.log(res.data); // { "some": "information" }
});
````
#### Get - Multi Page
````javascript
// Get all pages of information using the next header link.
var path = "/user/repos"; // Returns a list of repos that can span multiple pages
github.getAll(path).on("end", function (arrRes) {
	// arrRes is an array of standard https response object, same as get()
	console.log(arrRes[0].statusCode);
	
	// link header is upgraded to an object with rel as property name;
	console.log(arrRes[0].headers.link); // { "next": "...", "last": "...", "first": "...", "prev": "..." }
	
	// individual data properties.
	console.log(arrRes[0].data); // [ { "some":"information" } ]
	
	// additionally the returned array has a data property that holds a concatination of all data.
	// 'data' holds the json parsed body of the response.
	console.log(arrRes.data); // [ { "some":"information" }, { "some2":"information2" }, { "some3":"information3" } ]
});
````
