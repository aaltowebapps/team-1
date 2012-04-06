// Create a GpsApi that uses 'geolocation' to access the GPS
GpsApi = function (geolocation) {
    'use strict';

    // TODO: Add protection for calling the constructor without 'new'
    // if () return new GpsApi(geolocation);

    this.geolocation = geolocation;
    this.watcherId = undefined;
    this.watchOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
    };
    this.samples = [];

    return this;
};

// Reset the GPS tracking
GpsApi.prototype.reset = function () {
    'use strict';

    this.stop();
    this.samples = [];
};

// Start observing the GPS
GpsApi.prototype.start = function () {
    'use strict';

    // Do nothing if this was already started
    if (this.watcherId) { return; }

    var that = this;

    var positionCallback = function (coordinates) {
        if (!coordinates || !coordinates.coords) {
            console.error("GpsApi.prototype.start->positionCallback: No coordinates provided!");
            return;
        }

        // Convert the sample format
        var sample = {
            "ts": coordinates.timestamp,
            "lat": coordinates.coords.latitude,
            "lng": coordinates.coords.longitude,
            "alt": coordinates.coords.altitude,
            "dir": coordinates.coords.heading,
            "spd": coordinates.coords.speed
        };

        if (!sample.alt) {
            // The altitude is missing, 
            // TODO: get it from Google Elevantion API
            sample.alt = 0;
        }

        if (!sample.spd) {
            // The speed is missing, 
            // TODO: determine the difference with the previous sample
            sample.spd = 0;
        }

        if (!sample.dir) {
            // The heading is missing, 
            // TODO: A.) try using the Sensors API
            // TODO: B.) determine the difference with the previous sample
            sample.dir = 0;
        }

        // Store the sample
        that.samples.push(sample);
    };

    var positionErrorCallback = function (error) {
        if (!error) {
            console.error("GpsApi.start.positionErrorCallback(" + error + ")");
            return;
        }
        console.error("GpsApi.start.positionErrorCallback({'code': " + error.code + ", 'message': '" + error.message + "'})");
    };

    this.watcherId = this.geolocation.watchPosition(positionCallback, positionErrorCallback, this.watchOptions);
};

// Stop observing the GPS
GpsApi.prototype.stop = function () {
    'use strict';

    // Do nothing if this was not started
    if (!this.watcherId) { return; }

    this.geolocation.clearWatch(this.watcherId);

};
