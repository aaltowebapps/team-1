(function () {
	'use strict';

	var $debugCoordsList = null;
	var coordinateStorage = [];
	var trackerInterval = null;
	var googleMap = null;
	var routeLine = null;
	var lastTimeStamp = 0;
	var intervalTime = 1000;
	var tracker = {
		initializeGoogleMaps: function (domId, centerLat, centerLng) {
			var myOptions = {
				center: new google.maps.LatLng(centerLat, centerLng),
				zoom: 10,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			googleMap = new google.maps.Map(document.getElementById(domId), myOptions);
		},

		setDebugCoordsList: function (element) {
			$debugCoordsList = element;
		},

		coordinatesToList: function (coordinates) {
			if (coordinates && coordinates.coords && coordinates.timestamp) {
				if ($debugCoordsList) {
					var children = $debugCoordsList.children();
					if (children.length >= 10) {
						children.last().detach();
					}
					$debugCoordsList.prepend('<div>Lat: ' + coordinates.coords.latitude + ', Lng: ' + coordinates.coords.longitude + ', Accuracy: ' + coordinates.coords.accuracy + ', timestamp: ' + coordinates.timestamp + '</div>');
				}
				coordinateStorage.push(coordinates);
			}
		},

		drawRoute: function () {
			if (googleMap) {
				if (!routeLine) {
					routeLine = new google.maps.Polyline({
						strokeColor: "#FF0000",
						strokeOpacity: 1.0,
						strokeWeight: 2
					});
					routeLine.setMap(googleMap);
				}
				var arr = [];
				$.each(coordinateStorage, function (index, item) {
					arr.push(new google.maps.LatLng(item.coords.latitude, item.coords.longitude));
				});
				routeLine.setPath(arr);
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
} ());