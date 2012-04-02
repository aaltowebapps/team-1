(function () {
	'use strict';

	var $debugCoordsList = null;
	var coordinateStorage = [];
	var	trackerInterval = null;
	var lastTimeStamp = 0;
	var intervalTime = 1000;
	var tracker = {
		setDebugCoordsList: function (element) {
			$debugCoordsList = element;
		},

		coordinatesToList: function (coordinates) {
			if (coordinates && coordinates.coords && coordinates.timestamp) {
				if ($debugCoordsList) {
					$debugCoordsList.append('<div>Lat: ' + coordinates.coords.latitude + ', Lng: ' + coordinates.coords.longitude + ', Accuracy: ' + coordinates.coords.accuracy + ', timestamp: ' + coordinates.timestamp + '</div>');
				}
			}
		},

		pollCoordinates: function () {
			if (navigator) {
				navigator.geolocation.getCurrentPosition(tracker.coordinatesToList);
			}
		},

		toggleTracking: function () {
			if (trackerInterval !== null) {
				clearInterval(trackerInterval);
				trackerInterval = null;
			} else {
				trackerInterval = setInterval(tracker.pollCoordinates, intervalTime);
			}
		}
	};

	window.tracker = tracker;
}());