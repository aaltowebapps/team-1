// Install:
// * node.js
// * npm install express

// The server configuration
var configuration = {
	PORT: 8080, 
	ROOT: __dirname + "/public"
	};

// Required modules
var express = require('express');

// Create the server
var app = express.createServer();

// Serve the REST API
app.get('/hello/world', function(req, res){
	res.send('Hello World');
});

// Serve static files from 'SERVER_ROOT'
app.use(express.static(configuration.ROOT));

// Start the server
app.listen(configuration.PORT);
