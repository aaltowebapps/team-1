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

// Get the samples as a base64 encoded blob
GpsApi.prototype.toBase64 = function () {
    'use strict';

    var sampleToString = function (sample) {
        return sample.ts + ";" + sample.lat + ";" + sample.lng + ";" + sample.alt + ";" + sample.dir + ";" + sample.spd;
    };

    var blob = "";
    var i;
    for (i = 0; i < this.samples.length; i += 1) {
        if (i > 0) { blob = blob + "|"; }
        blob = blob + sampleToString(this.samples[i]);
    }

    return blob;
};

// Populate the samples from a base64 encoded blob
GpsApi.prototype.fromBase64 = function (blob) {
    'use strict';

    this.reset();

    var stringToSample = function (sampleAsString) {
        var sampleAsList = sampleAsString.split(";");
        var sample = {
            "ts": parseFloat(sampleAsList[0]),
            "lat": parseFloat(sampleAsList[1]),
            "lng": parseFloat(sampleAsList[2]),
            "alt": parseFloat(sampleAsList[3]),
            "dir": parseFloat(sampleAsList[4]),
            "spd": parseFloat(sampleAsList[5])
        };
        return sample;
    };

    var samplesAsList = blob.split("|");
    var i;
    for (i = 0; i < samplesAsList.length; i += 1) {
        this.samples.push(stringToSample(samplesAsList[i]));
    }
};
