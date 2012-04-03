(function () {
	'use strict';

	var $debugCoordsList = null;
	var coordinateStorage = [];
	var trackerInterval = null;
	var googleMap = null;
	var routeLine = null;
	var watcherId = null;
	var lastTimeStamp = 0; // not in use yet
	var intervalTime = 1000; // not in use
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
			var i;
			var cssClass = 'debugCoord';
			if (coordinates && coordinates.coords && coordinates.timestamp)
			{
				if ($debugCoordsList)
				{
					var children = $debugCoordsList.children().hasClass(cssClass);
					for (i = children.length - 10; i > 0; i--)
					{
						children.last().removeClass(cssClass).hide('slow');
						children = children.slice(0, children.length - 1);
					}
					var $item = $('<div>Lat: ' + coordinates.coords.latitude + ', Lng: ' + coordinates.coords.longitude + ', Accuracy: ' + coordinates.coords.accuracy + ', timestamp: ' + coordinates.timestamp + '</div>');
					$debugCoordsList.prepend($item);
					$item.addClass(cssClass).hide().show('slow');
				}
				coordinateStorage.push(coordinates);
			}
		},

		drawRoute: function () {
			if (googleMap)
			{
				if (!routeLine)
				{
					routeLine = new google.maps.Polyline({
						strokeColor: "#0000FF",
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
				googleMap.setCenter(arr[arr.length - 1]); // Conditional centering/zooming?
			}
		},

		startPolling: function () {
			if (navigator)
			{
				watcherId = navigator.geolocation.watchPosition(tracker.positionCallback, tracker.positionErrorCallback, {
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 1000
				});
			}
		},

		stopPolling: function () {
			if (navigator && watcherId !== null)
			{
				navigator.geolocation.clearWatch(watcherId);
				watcherId = null;
			}
		},

		positionCallback: function (coordinates) {
			tracker.coordinatesToList(coordinates);
			tracker.drawRoute();
		},

		positionErrorCallback: function (error) {
			if (error && error.code && error.message)
			{
				var $errorNote = $("body").children('.errorNote');
				var errorStr = 'Error (' + error.code + '): ' + error.message;
				if (!$errorNote)
				{
					$errorNote = $('<div>' + errorStr + '</div>');
					$errorNote.addClass('errorNote')
					$("body").append($errorNote);
				}
				$errorNote.html(errorStr);
			}
		},

		toggleTracking: function () {
			if (watcherId !== null)
			{
				tracker.stopPolling();
			} else
			{
				tracker.startPolling();
			}
		}
	};

	window.tracker = tracker;
} ());