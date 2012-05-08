(function () {
	'use strict';

	var trackerSettings = {
		//		intervalTime: 1000,
		routeLineDiff: 0,
		debugCoordinates: null,
		debugMaxAmount: 15,
		statusCallback: null,
		followLocation: true,
		routeLineOpts: {
			strokeColor: "#0000FF",
			strokeOpacity: 1.0,
			strokeWeight: 2
		}
	}; // Default settings. Changed with changeSettings-function

	var coordinateStorage = [];
	var googleMap = null;
	var routeLine = null;
	var watcherId = null;
	var testIntervalId = null; // test var
	var lastTimeStamp = 0; // not in use yet
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
				zoom: 12,
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
					var diff = coordinates.timestamp - lastTimeStamp;
					lastTimeStamp = coordinates.timestamp;
					var $item = $('<div>Lat: ' + coordinates.coords.latitude + ', Lng: ' + coordinates.coords.longitude + ', Accuracy: ' + coordinates.coords.accuracy + ', timestamp: ' + coordinates.timestamp + ', diffToPrev: ' + diff + '</div>');
					trackerSettings.debugCoordinates.prepend($item);
					$item.addClass(cssClass).hide().show('slow');
				}
				var distToPrev = 0;
				if (coordinateStorage.length > 0)
				{
					var last = coordinateStorage[coordinateStorage.length - 1];
					distToPrev = calculateDistance(last.coords, coordinates.coords, true);
				}
				coordinates.distanceToPrevious = distToPrev;
				coordinateStorage.push(coordinates);
			}
		}

		function drawRoute() {
			if (googleMap)
			{
				if (!routeLine)
				{
					routeLine = new google.maps.Polyline(trackerSettings.routeLineOpts);
					routeLine.setMap(googleMap);
				}
				var arr = [];
				var last = 0;
				$.each(coordinateStorage, function () {
					if (this.timestamp - last > trackerSettings.routeLineDiff)
					{
						// Draw point only if time diff to last point is bigger that routeLineDiff-setting
						arr.push(new google.maps.LatLng(this.coords.latitude, this.coords.longitude));
						last = this.timestamp;
					}
				});
				routeLine.setPath(arr);
				if (trackerSettings.followLocation)
				{
					googleMap.setCenter(arr[arr.length - 1]); // Conditional centering/zooming?
				}
			}
		}

		function getPlottableCoordinates(trackId, target) {
			var arr = [];
			var timeFirst = null;
			var timePrev = null;
			var distSum = 0;
			$.each(coordinateStorage, function (index, item) {
				var time, dist;
				if (timeFirst == null)
				{
					timeFirst = item.timestamp;
					time = 0;
				}
				else
				{
					time = (item.timestamp - timeFirst) / 60000; // Time as minutes
				}
				switch (target)
				{
					case 'distance':
						distSum = distSum + item.distanceToPrevious;
						arr.push([time, distSum]);
						break;
					case 'speed':
						var speed;
						if (timePrev == null || item.timestamp == timePrev)
						{
							speed = 0;
						} else
						{
							speed = item.distanceToPrevious / ((item.timestamp - timePrev)/(1000*3600));
						}
						timePrev = item.timestamp;
						arr.push([time, speed]);
						break;
					default:
						break;
				}
			});
			return arr;
		}

		function updateStatus() {
			if (trackerSettings.statusCallback && $.isFunction(trackerSettings.statusCallback))
			{
				var last = coordinateStorage[coordinateStorage.length - 1];
				trackerSettings.statusCallback(last);
			}
		}

		// Distance between two coordinate pairs in kilometres.
		// Ref: http://www.codecodex.com/wiki/Calculate_distance_between_two_points_on_a_globe#JavaScript

		function calculateDistanceOriginal(lat1, lon1, lat2, lon2) {
			var R = 6371; // km
			var dLat = (lat2 - lat1) * Math.PI / 180;
			var dLon = (lon2 - lon1) * Math.PI / 180;
			var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
					Math.sin(dLon / 2) * Math.sin(dLon / 2);
			var c = 2 * Math.asin(Math.sqrt(a));
			var d = R * c;
			return d;
		}

		function calculateDistance(coords1, coords2, includeAltitude) {
			var lat1 = coords1.latitude;
			var lng1 = coords1.longitude;
			var lat2 = coords2.latitude;
			var lng2 = coords2.longitude;
			var d = calculateDistanceOriginal(lat1, lng1, lat2, lng2);
			if (includeAltitude)
			{
				var altDiff = coords1.altitude - coords2.altitude;
				d = Math.sqrt(d * d + altDiff * altDiff);
			}
			return d;
		}

		function positionCallback(coordinates) {
			coordinatesToList(coordinates);
			drawRoute();
			updateStatus();
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
					maximumAge: 500
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

			//			coordinatesToList: function (coordinates) {
			//				coordinatesToList(coordinates);
			//			},

			getPlottableCoordinates: function (trackId, target) {
				return getPlottableCoordinates(trackId, target);
			},

			startPolling: function () {
				startPolling();
			},

			stopPolling: function () {
				stopPolling();
			},

			calculateDistance: function (coords1, coords2, includeAltitude) {
				return calculateDistance(coords1, coords2, includeAltitude);
			},

			// -- For debuggin:
			positionCallback: function (coordinates) {
				positionCallback(coordinates);
			},
			toggleTestDraw: function () {
				var dividend = 0;
				var divisor = 16;
				var incr = 0.0001;
				var rad = 0.004;
				var latInit = 60.205945;
				var lngInit = 24.734387;
				if (coordinateStorage.length > 0)
				{
					latInit = coordinateStorage[coordinateStorage.length - 1].coords.latitude;
					lngInit = coordinateStorage[coordinateStorage.length - 1].coords.longitude;
				}
				if (testIntervalId === null)
				{
					testIntervalId = setInterval(function () {
						var lat = latInit + incr + Math.sin(Math.PI * dividend / divisor) * rad;
						var lng = lngInit + incr + Math.cos(Math.PI * dividend / divisor) * rad;
						positionCallback({
							coords: {
								accuracy: 10,
								altitude: null,
								altitudeAccuracy: null,
								heading: null,
								latitude: lat,
								longitude: lng,
								speed: null
							},
							timestamp: Date.now()
						});
						incr += 0.0001;
						dividend += 1;
						if (dividend === 32)
						{
							dividend = 0;
						}
						//						console.log('Test coords. lat: ' + lat + ', lng: ' + lng);
					}, 1000);
				} else
				{
					clearInterval(testIntervalId);
					testIntervalId = null;
				}
			},
			// ^^ For debugging

			toggleTracking: function () {
				if (watcherId !== null)
				{
					stopPolling();
				}
				else
				{
					startPolling();
				}
			}
		};
	};

	window.tracker = tracker();
} ());
