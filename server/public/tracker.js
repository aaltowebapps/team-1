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
			if (console) {
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
			if (coordinates && coordinates.coords && coordinates.timestamp) {
				if (trackerSettings.debugCoordinates) {
					var children = trackerSettings.debugCoordinates.children('.' + cssClass);
					for (i = children.length - trackerSettings.debugMaxAmount; i > 0; i = i - 1) {
						children.last().removeClass(cssClass).hide('slow').detach();
						children = children.slice(0, children.length - 1);
					}
					var diff = coordinates.timestamp - lastTimeStamp;
					lastTimeStamp = coordinates.timestamp;
					var $item = $('<div>Lat: ' + coordinates.coords.latitude + ', Lng: ' + coordinates.coords.longitude + ', Accuracy: ' + coordinates.coords.accuracy + ', timestamp: ' + coordinates.timestamp + ', diffToPrev: ' + diff + '</div>');
					trackerSettings.debugCoordinates.prepend($item);
					$item.addClass(cssClass).hide().show('slow');
				}
				coordinateStorage.push(coordinates);
			}
		}

		function drawRoute() {
			if (googleMap) {
				if (!routeLine) {
					routeLine = new google.maps.Polyline(trackerSettings.routeLineOpts);
					routeLine.setMap(googleMap);
				}
				var arr = [];
				var last = 0;
				$.each(coordinateStorage, function () {
					if (this.timestamp - last > trackerSettings.routeLineDiff) {
						// Draw point only if time diff to last point is bigger that routeLineDiff-setting
						arr.push(new google.maps.LatLng(this.coords.latitude, this.coords.longitude));
						last = this.timestamp;
					}
				});
				routeLine.setPath(arr);
				if (trackerSettings.followLocation) {
					googleMap.setCenter(arr[arr.length - 1]); // Conditional centering/zooming?
				}
			}
		}

		function updateStatus() {
			if (trackerSettings.statusCallback && $.isFunction(trackerSettings.statusCallback)) {
				var last = coordinateStorage[coordinateStorage.length - 1];
				trackerSettings.statusCallback(last);
			}
		}

		function positionCallback(coordinates) {
			coordinatesToList(coordinates);
			drawRoute();
			updateStatus();
		}

		function positionErrorCallback(error) {
			if (error && error.code && error.message) {
				var $errorNote = $("body").children('.errorNote');
				var errorStr = 'Error (' + error.code + '): ' + error.message;
				if (!$errorNote) {
					$errorNote = $('<div>' + errorStr + '</div>');
					$errorNote.addClass('errorNote');
					$("body").append($errorNote);
				}
				$errorNote.html(errorStr);
			}
		}

		function startPolling() {
			if (navigator) {
				watcherId = navigator.geolocation.watchPosition(positionCallback, positionErrorCallback, {
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 500
				});
				$("#trackingStatus").html('Tracking in progress...');
			}
		}

		function stopPolling() {
			if (navigator && watcherId !== null) {
				navigator.geolocation.clearWatch(watcherId);
				watcherId = null;
			}
			$("#trackingStatus").html('Not tracking.');
		}

		initialize();

		return {
			initializeMap: function (domId, centerLat, centerLng, settings) {
				initializeGoogleMaps(domId, centerLat, centerLng);
				if (settings) {
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
				if (coordinateStorage.length > 0) {
					latInit = coordinateStorage[coordinateStorage.length - 1].coords.latitude;
					lngInit = coordinateStorage[coordinateStorage.length - 1].coords.longitude;
				}
				if (testIntervalId === null) {
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
						if (dividend === 32) {
							dividend = 0;
						}
						//						console.log('Test coords. lat: ' + lat + ', lng: ' + lng);
					}, 1000);
				} else {
					clearInterval(testIntervalId);
					testIntervalId = null;
				}
			},
			// ^^ For debugging

			toggleTracking: function () {
				if (watcherId !== null) {
					stopPolling();
				} else {
					startPolling();
				}
			}
		};
	};

	window.tracker = tracker();
}());
