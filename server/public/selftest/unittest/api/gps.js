//////////////////////////////////////////////////////////////
// Create a mock geolocation Api
GeolocationMock = function () {
    'use strict';

    // Add protection for calling the constructor without 'new'
    if (!(this instanceof GeolocationMock)) { return new GeolocationMock(); }

    this.positionCallback = undefined;
    this.positionErrorCallback = undefined;
    this.watchOptions = undefined;
    this.watcherId = 123;
    this.timerId = 0;

    var s = function(lat, lng, alt, spd, dir) {
        return {
            "timestamp": 0,
            "coords": { "latitude": lat, "longitude": lng, 
                "altitude": alt, "speed": spd, "heading": dir }
        };
    }

    this.sampleIndex = 0;
    this.samples = [
        s(12.345, 67.890, 135, 79, 24),
        s(54.321,  9.876, 135, 79, 24),
        s( 1.357,  7.531, 135, 79, 24)
    ];

    return this;
};

GeolocationMock.prototype.getCurrentPosition = function (successCallback, errorCallback, options) {
    this.samples[this.sampleIndex].timestamp = new Date().getTime();
    successCallback(this.samples[this.sampleIndex]);
};

GeolocationMock.prototype.watchPosition = function (positionCallback, positionErrorCallback, watchOptions) {
    this.positionCallback = positionCallback;
    this.positionErrorCallback = positionErrorCallback;
    this.watchOptions = watchOptions;
    return this.watcherId;
};

GeolocationMock.prototype.clearWatch = function (watcherId) {
    this.watcherId = watcherId;
};

GeolocationMock.prototype.nextSample = function () {
    if (this.sampleIndex >= this.samples.length) { this.sampleIndex = 0; }
    this.getCurrentPosition(this.positionCallback, this.positionErrorCallback, this.watchOptions);
    this.sampleIndex = this.sampleIndex + 1;
};

GeolocationMock.prototype.sample = function (index) {
    if (index >= this.samples.length) { return; }
    return this.samples[index];
};

// A mock geolocation for testing
var googleMapsMock = {
    trace: [],
    LatLng: function (latitude, longitude) {
        googleMapsMock.trace.push("LatLng('" + latitude + "', '" + longitude + "')");
        return {"lat": latitude, "lng": longitude};
    }
};


describe("GpsApi.reset()", function() {
    it("samples removed", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        expect(gps.samples).toEqual([]);
        gps.samples = [1,2,3];
        expect(gps.samples).toNotEqual([]);
        gps.reset();
        expect(gps.samples).toEqual([]);
    });

    it("stops existing watch", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        geoMock.watcherId = 123;
        gps.start();
        expect(geoMock.watcherId).toEqual(123);
        geoMock.watcherId = 321;
        expect(geoMock.watcherId).toEqual(321);
        gps.reset();
        expect(geoMock.watcherId).toEqual(123);

    });
});

describe("GpsApi.start()", function() {
    it("enables high accuracy", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        geoMock.watchOptions = undefined;
        gps.start();
        expect(geoMock.watchOptions.enableHighAccuracy).toEqual(true);
    });

    it("stores samples", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        geoMock.positionCallback = undefined;
        gps.start();
        expect(typeof geoMock.positionCallback).toEqual("function");
        // Simulate a GPS callback
        geoMock.nextSample();
        // And add another sample
        geoMock.nextSample();
        // Both samples should be stored
        expect(gps.samples.length).toEqual(2);
        expect(gps.samples[0].lat).toEqual(12.345);
        expect(gps.samples[0].lng).toEqual(67.89);
        expect(gps.samples[1].lat).toEqual(54.321);
        expect(gps.samples[1].lng).toEqual(9.876);
    });
});

describe("GpsApi.stop()", function() {
    it("stops correct watcherId", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        geoMock.watcherId = 123;
        gps.start();
        expect(geoMock.watcherId).toEqual(123);
        geoMock.watcherId = 321;
        expect(geoMock.watcherId).toEqual(321);
        gps.stop();
        expect(geoMock.watcherId).toEqual(123);
    });
});

describe("GpsApi.toBase64() and GpsApi.fromBase64()", function() {
    it("same samples after a base64 round-trip", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        gps.start();
        // Simulate a GPS callback
        geoMock.nextSample();
        // And add another sample
        geoMock.nextSample();

        var base64data = gps.toBase64();
        gps.reset();
        expect(gps.samples.length).toEqual(0);
        gps.fromBase64(base64data);

        // Both samples should be loaded
        expect(gps.samples.length).toEqual(2);
        expect(gps.samples[0].lat).toEqual(12.345);
        expect(gps.samples[0].lng).toEqual(67.89);
        expect(gps.samples[1].lat).toEqual(54.321);
        expect(gps.samples[1].lng).toEqual(9.876);
    });
});

describe("GpsApi.status()", function() {
    it("current status is equal to the last sample", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        gps.start();
        geoMock.nextSample();
        // The sample should be the current status
        expect(gps.status()).toEqual(geoMock.sample(0).coords);
        geoMock.nextSample();
        // Now the second sample should be the current status
        expect(gps.status()).toEqual(geoMock.sample(1).coords);
    });
});

describe("GpsApi.googleMapsTrack()", function() {
    it("converts all samples to 'google.maps.LatLng' type", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        gps.start();
        // Simulate a GPS callback
        geoMock.nextSample();
        // Add the second sample
        geoMock.nextSample();
        
        googleMapsMock.trace = [];
        var googleFormat = gps.googleMapsTrack(googleMapsMock);
        expect(googleFormat).toEqual([{"lat": 12.345, "lng": 67.89}, {"lat": 54.321, "lng": 9.876}]);
        expect(googleMapsMock.trace).toEqual(["LatLng('12.345', '67.89')", "LatLng('54.321', '9.876')"]);
    });

    it("convert only new samples to 'google.maps.LatLng' type", function() {
        var geoMock = new GeolocationMock();
        var gps = new GpsApi(geoMock);
        gps.start();
        // Simulate a GPS callback
        geoMock.nextSample();
        // Add the second sample
        geoMock.nextSample();
        // Convert the samples to google format, this should be cached
        gps.googleMapsTrack(googleMapsMock);
        // Add the third sample
        geoMock.nextSample();
        
        googleMapsMock.trace = [];
        var googleFormat = gps.googleMapsTrack(googleMapsMock);
        expect(googleFormat).toEqual([{"lat": 12.345, "lng": 67.89}, {"lat": 54.321, "lng": 9.876}, {"lat": 1.357, "lng": 7.531}]);
        expect(googleMapsMock.trace).toEqual(["LatLng('1.357', '7.531')"]);
    });
});
