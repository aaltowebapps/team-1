// This file handle the 'track' API


function getTracksForUser(req, res){
	// TODO: Check if 'req.params.user' is logged in
	// var tracks = getTracksForUser(req.params.user)
	var track1 = {name: "Track 1", key: "abc"};
	var track2 = {name: "Track Twee", key: "aBc2"};
	var track3 = {name: "Track Three", key: "333"};
	var tracks = [track1, track2, track3];
	res.json(tracks);
};

function getTrackInfo(req, res){
	// TODO: Check if 'req.params.user' is logged in
	//       and has access to 'req.params.track'
	// var tracks = getTrackInfo(req.params.track)
	var point1 = {"lon": 12.345, "lng": 67.890, "alt": 135.79, "ts": 23423423};
	var point2 = {"lon": 12.355, "lng": 67.880, "alt": 133.45, "ts": 23424423};
	var point3 = {"lon": 12.365, "lng": 67.870, "alt": 132.72, "ts": 23425423};
	var point4 = {"lon": 12.375, "lng": 67.860, "alt": 136.95, "ts": 23426423};
	var tracks = {"name": "Track 1", "data": [point1, point2, point3, point4]};
	res.json(tracks);
};

function setTrackInfo(req, res){
	// TODO: Check if 'req.params.user' is logged in
	//       and has access to 'req.params.track'
	// setTrackInfo(req.params.track)
	req.on('data', function(chunk) {
		console.log("Received body data:");
		console.log(chunk.toString());
	});
	res.json(true);
};


// This function registers the 'track' API
exports.registerApi = function (app) {
	app.get("/track/:user", getTracksForUser);
	app.get("/track/:user/:track", getTrackInfo);
	app.post("/track/:user/:track", setTrackInfo);
};
