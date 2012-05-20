(function () {
	'use strict';

	var trackerSettings = {
		//		intervalTime: 1000,
		routeLineDiff: 0,
		minGpsAccuracy: 20,
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
	var coordinateStorageId = 0;
	var trackIsEditable = true;
	var googleMap = null;
	var routeLine = null;
	var routeLinePath = null;
	var watcherId = null;
	var testIntervalId = null; // test var
	var lastTimeStamp = 0;
	var serverUrl = "/track/UID123/";
	var xmlHttpRequest = new XMLHttpRequest();

	var tracker = function () {

		function resetTrack() {
			coordinateStorage = [];
			coordinateStorageId = (new Date()).getTime();
			routeLinePath = null;
			lastTimeStamp = 0;
			trackIsEditable = true;
		}

		// Get the samples as a base64 encoded blob

		function toBase64() {
			var sampleToString = function (sample) {
				return sample.timestamp + ";" + sample.coords.latitude + ";" + sample.coords.longitude + ";" + sample.coords.altitude + ";" + sample.coords.direction + ";" + sample.coords.speed + ";" + sample.coords.accuracy;
			};

			var blob = "";
			var i;
			for (i = 0; i < coordinateStorage.length; i += 1)
			{
				if (i > 0)
				{
					blob = blob + "|";
				}
				blob = blob + sampleToString(coordinateStorage[i]);
			}

			return blob;
		}

		// Populate the samples from a base64 encoded blob

		function fromBase64(blob) {
			var stringToSample = function (sampleAsString) {
				var sampleAsList = sampleAsString.split(";");
				var sample = {
					"timestamp": parseFloat(sampleAsList[0]),
					"coords": {
						"latitude": parseFloat(sampleAsList[1]),
						"longitude": parseFloat(sampleAsList[2]),
						"altitude": parseFloat(sampleAsList[3]),
						"direction": parseFloat(sampleAsList[4]),
						"speed": parseFloat(sampleAsList[5]),
						"accuracy": parseFloat(sampleAsList[6])
					}
				};
				return sample;
			};

			var samplesAsList = blob.split("|");
			var result = [];
			var i;
			for (i = 0; i < samplesAsList.length; i += 1)
			{
				result.push(stringToSample(samplesAsList[i]));
			}
			return result;
		}

		function sendTrackData(data, name) {
			xmlHttpRequest.open("POST", serverUrl + name + "/", false);
			xmlHttpRequest.setRequestHeader("Content-type", "application/json");
			xmlHttpRequest.send(data);
		}

		// If trackName is null, return list of tracks

		function loadData(trackName) {
			var getTrack = true;
			if (typeof (trackName) === 'undefined' || trackName === null)
			{
				getTrack = false;
				xmlHttpRequest.open("GET", serverUrl, false);
			} else
			{
				xmlHttpRequest.open("GET", serverUrl + trackName + "/", false);
			}
			xmlHttpRequest.send();
			var data = xmlHttpRequest.responseText;
			if (getTrack)
			{
				return fromBase64(data);
			}
			return data;
		}

		function getSavedTracks() {
			var tracks = loadData();
			return tracks;
		}

		function getSavedTrack(trackName) {
			trackIsEditable = false;
			coordinateStorage = loadData(trackName);
		}

		function saveTrack() {
			if (!trackIsEditable)
			{
				return false;
			}
			var data = toBase64();
			sendTrackData(data, coordinateStorageId);
			resetTrack();
			return true;
		}

		function initialize() {
			if (console)
			{
				console.debug("Tracker initialized.");
			}
		}

		function initializeGoogleMaps(domId, centerLat, centerLng) {
			var myOptions = {
				center: new google.maps.LatLng(centerLat, centerLng),
				zoom: 16,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			googleMap = new google.maps.Map(document.getElementById(domId), myOptions);
		}

		function changeSettings(settings) {
			$.extend(trackerSettings, settings); // Merge with current settings
		}

		// Distance between two coordinate pairs in kilometres.
		// Ref: http://www.codecodex.com/wiki/Calculate_distance_between_two_points_on_a_globe#JavaScript

		function calculateDistanceOriginal(lat1, lon1, lat2, lon2) {
			var R = 6371; // km
			var dLat = (lat2 - lat1) * Math.PI / 180;
			var dLon = (lon2 - lon1) * Math.PI / 180;
			var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
			if (includeAltitude && coords1.altitude && coords2.altitude && !isNaN(coords1.altitude) && !isNaN(coords2.altitude))
			{
				var altDiff = coords1.altitude - coords2.altitude;
				d = Math.sqrt(d * d + altDiff * altDiff);
			}
			return d;
		}

		function calculateDistanceToPrev(cur, index) {
			var distToPrev = 0;
			var prev;
			if (index === 0)
			{
				cur.distanceToPrevious = 0;
				return;
			}
			if (coordinateStorage.length > 0)
			{
				if (typeof (index) === 'undefined')
				{
					prev = coordinateStorage[coordinateStorage.length - 1];
				} else
				{
					prev = coordinateStorage[index - 1];
				}
				distToPrev = calculateDistance(prev.coords, cur.coords, true);
			}
			cur.distanceToPrevious = distToPrev;
		}

		function calculateDistancesToPrev() {
			for (var i = coordinateStorage.length - 1; i >= 0; i = i - 1)
			{
				var cur = coordinateStorage[i];
				if (typeof (cur.distanceToPrevious) !== 'undefined')
					continue; // All else already calculated
				calculateDistanceToPrev(cur, i);
			}
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
				coordinateStorage.push(coordinates);
				calculateDistancesToPrev();
			}
		}

		function isCoordinateAccurate(coord) {
			if (typeof (coord) !== 'undefined' && coord.coords.accuracy && coord.coords.accuracy <= trackerSettings.minGpsAccuracy)
				return true;
			return false;
		}

		function drawRoute(fromScratch) {
			if (googleMap)
			{
				if (!routeLine)
				{
					routeLine = new google.maps.Polyline(trackerSettings.routeLineOpts);
					routeLine.setMap(googleMap);
				}
				if (routeLinePath === null)
				{
					routeLinePath = [];
				}
				if (fromScratch)
				{
					$.each(coordinateStorage, function () {
						if (isCoordinateAccurate(this))
						{
							// Draw point only if accuracy is greater than the minimum setting
							routeLinePath.push(new google.maps.LatLng(this.coords.latitude, this.coords.longitude));
						}
					});
				} else
				{
					var last = coordinateStorage[coordinateStorage.length - 1];
					if (isCoordinateAccurate(last))
					{
						// Draw point only if accuracy is greater than the minimum setting
						routeLinePath.push(new google.maps.LatLng(last.coords.latitude, last.coords.longitude));
					}
				}
				routeLine.setPath(routeLinePath);
				if (trackerSettings.followLocation)
				{
					googleMap.setCenter(routeLinePath[routeLinePath.length - 1]); // Conditional centering/zooming?
				}
			}
		}

		function getPlottableCoordinates(trackId, target) {
			var storage = coordinateStorage;
			var arr = [];
			var timeFirst = null;
			var timePrev = null;
			var distSum = 0;
			if (typeof ([storage.length - 1].distanceToPrevious) === 'undefined')
			{
				calculateDistancesToPrev();
				storage = coordinateStorage;
			}
			$.each(storage, function (index, item) {
				var time, dist;
				// Discard all coordinates that are not accurate.
				if (isCoordinateAccurate(item))
				{
					if (timeFirst === null)
					{
						timeFirst = item.timestamp;
						time = 0;
					} else
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
							if (timePrev === null || item.timestamp === timePrev)
							{
								speed = 0;
							} else
							{
								speed = item.distanceToPrevious / ((item.timestamp - timePrev) / (1000 * 3600));
							}
							timePrev = item.timestamp;
							arr.push([time, speed]);
							break;
						default:
							break;
					}
				}
			});
			return arr;
		}

		function updateStatus() {
			if (trackerSettings.statusCallback && $.isFunction(trackerSettings.statusCallback))
			{
				var last = coordinateStorage[coordinateStorage.length - 1];
				last = $.extend({
					'trackid': coordinateStorageId,
					'trackiseditable': trackIsEditable
				}, last);
				trackerSettings.statusCallback(last);
			}
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

		function askForReset() {
			var retVal = confirm("Cannot track more now. Do you want to reset tracking?");
			if (retVal === true)
			{
				resetTrack();
				return true;
			}
			return false;
		}

		function startPolling() {
			if (!trackIsEditable && !askForReset())
			{
				return;
			}
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

		function toggleTestDraw(stop) {
			if (testIntervalId === null && (!trackIsEditable && !askForReset()))
			{
				return;
			}
			var dividend = 0;
			var divisor = 16;
			var incr = 0.000007;
			var growth = incr;
			var rad = 0.0002;
			var latInit = 60.205945;
			var lngInit = 24.734387;
			if (coordinateStorage.length > 0)
			{
				latInit = coordinateStorage[coordinateStorage.length - 1].coords.latitude;
				lngInit = coordinateStorage[coordinateStorage.length - 1].coords.longitude;
			}
			if (testIntervalId === null && !stop)
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
					incr += growth;
					dividend += 1;
					if (dividend === 32)
					{
						dividend = 0;
					}
				}, 1000);
				$("#trackingStatus").html('Test is ON.');
			} else if (testIntervalId !== null)
			{
				clearInterval(testIntervalId);
				testIntervalId = null;
				$("#trackingStatus").html('Not tracking.');
			}
		}

		initialize();
		resetTrack();

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
				toggleTestDraw(true);
				startPolling();
			},

			stopPolling: function () {
				toggleTestDraw(true);
				stopPolling();
			},

			calculateDistance: function (coords1, coords2, includeAltitude) {
				return calculateDistance(coords1, coords2, includeAltitude);
			},

			// -- For debuggin:
			//			positionCallback: function (coordinates) {
			//				positionCallback(coordinates);
			//			},
			toggleTestDraw: function (stop) {
				stopPolling();
				toggleTestDraw(stop);
			},
			// ^^ For debugging

			toggleTracking: function () {
				toggleTestDraw(true);
				if (watcherId !== null)
				{
					stopPolling();
				} else
				{
					startPolling();
				}
			},

			saveTrack: function () {
				return saveTrack();
			},

			loadTrackList: function () {
				return getSavedTracks();
			},

			loadTrack: function (trackId) {
				stopPolling();
				toggleTestDraw(true);
				getSavedTrack(trackId);
				drawRoute(true);
			}
		};
	} ();

	window.Tracker = tracker;
})();
