// Install:
// * node.js
// * npm install express


// Required modules
var express = require('express');
var config = require('./config');
var track = require('./track');

// Create the server
var app = express.createServer();

// Register the 'track' REST API
track.registerApi(app);

// Serve static files from 'SERVER_ROOT'
app.use(express.static(config.ROOT));

// Start the server
app.listen(config.PORT);
