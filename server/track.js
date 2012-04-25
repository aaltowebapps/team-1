// This file handle the 'track' API

var tracks = {};

function getTracksForUser(req, res){
	// TODO: Check if 'req.params.user' is logged in
	// var tracks = getTracksForUser(req.params.user)

	var getNames = function(obj) {
		var keys = [];
		for(var key in obj){
			keys.push(key);
		}
		return keys;
	};

	res.json(getNames(tracks));
};

function getTrackInfo(req, res){
	// TODO: Check if 'req.params.user' is logged in
	//       and has access to 'req.params.track'
	// var tracks = getTrackInfo(req.params.track)

	if (!tracks[req.params.track]) {
		res.json({"message": "Track not found."});
		res.send(404);
		return;
	}

	res.send(tracks[req.params.track]);
};

function setTrackInfo(req, res){
	// TODO: Check if 'req.params.user' is logged in
	//       and has access to 'req.params.track'
	// setTrackInfo(req.params.track)

	req.on('data', function(chunk) {
		console.log("Received body data:");
		tracks[req.params.track] = chunk.toString();
		console.log(tracks[req.params.track]);
	});
	res.json(true);
};


// This function registers the 'track' API
exports.registerApi = function (app) {
	app.get("/track/:user", getTracksForUser);
	app.get("/track/:user/:track", getTrackInfo);
	app.post("/track/:user/:track", setTrackInfo);
};
