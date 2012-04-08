(function () {
	'use strict';

	var trackerSettings = {
		intervalTime: 1000,
		routeLineDiff: 5000,
		debugCoordinates: null,
		debugMaxAmount: 15,
		followLocation: true
	}; // Default settings. Changed with changeSettings-function

	var coordinateStorage = [];
	var googleMap = null;
	var routeLine = null;
	var watcherId = null;
	var lastTimeStamp = 0; // not in use yet
	//	var intervalTime = 1000; // not in use
	var tracker = function () {

		function initialize() {
			if (console)
			{
				console.debug("Tracker initialized.");
			}
		}

		function initializeGoogleMaps(domId, centerLat, centerLng) {
			var myOptions = {
				center: new google.maps.LatLng(centerLat, centerLng),
				zoom: 10,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			googleMap = new google.maps.Map(document.getElementById(domId), myOptions);
		}

		function changeSettings(settings) {
			$.extend(trackerSettings, settings); // Merge with current settings
		}

		function coordinatesToList(coordinates) {
			var i;
			var cssClass = 'debugCoord';
			if (coordinates && coordinates.coords && coordinates.timestamp)
			{
				if (trackerSettings.debugCoordinates)
				{
					var children = trackerSettings.debugCoordinates.children('.' + cssClass);
					for (i = children.length - trackerSettings.debugMaxAmount; i > 0; i = i - 1)
					{
						children.last().removeClass(cssClass).hide('slow').detach();
						children = children.slice(0, children.length - 1);
					}
					var $item = $('<div>Lat: ' + coordinates.coords.latitude + ', Lng: ' + coordinates.coords.longitude + ', Accuracy: ' + coordinates.coords.accuracy + ', timestamp: ' + coordinates.timestamp + '</div>');
					trackerSettings.debugCoordinates.prepend($item);
					$item.addClass(cssClass).hide().show('slow');
				}
				coordinateStorage.push(coordinates);
			}
		}

		function drawRoute() {
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
				var last = 0;
				$.each(coordinateStorage, function (index, item) {
					if (item.timestamp - last > trackerSettings.routeLineDiff)
					{
						// Draw point only if time diff to last point is bigger that routeLineDiff-setting
						arr.push(new google.maps.LatLng(item.coords.latitude, item.coords.longitude));
					}
				});
				routeLine.setPath(arr);
				if (trackerSettings.followLocation) {
					googleMap.setCenter(arr[arr.length - 1]); // Conditional centering/zooming?
				}
			}
		}

		function positionCallback(coordinates) {
			tracker.coordinatesToList(coordinates);
			tracker.drawRoute();
		}

		function positionErrorCallback(error) {
			if (error && error.code && error.message)
			{
				var $errorNote = $("body").children('.errorNote');
				var errorStr = 'Error (' + error.code + '): ' + error.message;
				if (!$errorNote)
				{
					$errorNote = $('<div>' + errorStr + '</div>');
					$errorNote.addClass('errorNote');
					$("body").append($errorNote);
				}
				$errorNote.html(errorStr);
			}
		}

		function startPolling() {
			if (navigator)
			{
				watcherId = navigator.geolocation.watchPosition(positionCallback, positionErrorCallback, {
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 1000
				});
				$("#trackingStatus").html('Tracking in progress...');
			}
		}

		function stopPolling() {
			if (navigator && watcherId !== null)
			{
				navigator.geolocation.clearWatch(watcherId);
				watcherId = null;
			}
			$("#trackingStatus").html('Not tracking.');
		}

		initialize();

		return {
			initializeMap: function (domId, centerLat, centerLng, settings) {
				initializeGoogleMaps(domId, centerLat, centerLng);
				if (settings)
				{
					changeSettings(settings);
				}
			},

			changeSettings: function (settings) {
				changeSettings(settings);
			},

			setDebugCoordsList: function (element) {
				changeSettings({ debugCoordinates: element });
			},

			coordinatesToList: function (coordinates) {
				coordinatesToList(coordinates);
			},

			startPolling: function () {
				startPolling();
			},

			stopPolling: function () {
				stopPolling();
			},

			toggleTracking: function () {
				if (watcherId !== null)
				{
					stopPolling();
				} else
				{
					startPolling();
				}
			}
		};
	};

	window.tracker = tracker();
} ());
