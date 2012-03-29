'use strict';

var $debugCoordsList = null;
var coordinateStorage = [];
var trackerInterval = null;
var intervalTime = 1000;

var tracker = {
	setDebugCoordsList: function (element) {
		$debugCoordsList = element;
	},

	coordinatesToList: function (coordinates) {
		if (coordinates && coordinates.coords) {
			if ($debugCoordsList) {
				$debugCoordsList.append('<div>Lat: ' + coordinates.coords.latitude + ', Lng: '
					+ coordinates.coords.longitude + ', Accuracy: '+coordinates.coords.accuracy+'</div>');
			}
		}
	},

	pollCoordinates: function () {
		navigator.geolocation.getCurrentPosition(tracker.coordinatesToList);
	},

	toggleTracking: function () {
		if (trackerInterval != null) {
			clearInterval(trackerInterval);
			trackerInterval = null;
		}
		else {
			trackerInterval = setInterval('tracker.pollCoordinates()', intervalTime);
		}
	}
}

window.tracker = tracker;