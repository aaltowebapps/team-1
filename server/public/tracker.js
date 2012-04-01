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
					+ coordinates.coords.longitude + ', Accuracy: '+coordinates.coords.accuracy+' - ' +coordinates.timestamp + '</div>');
			}
		}
	},

	pollCoordinates: function () {
		navigator.geolocation.watchPosition(tracker.coordinatesToList, null, {maximumAge:1000});
	},

	toggleTracking: function () {
		if (trackerInterval != null) {
			clearInterval(trackerInterval);
			trackerInterval = null;
		}
		else {
			tracker.pollCoordinates();
			// trackerInterval = setInterval('tracker.pollCoordinates()', intervalTime);
		}
	}
}

window.tracker = tracker;