// A mock geolocation for testing
var geolocationMock = {
    watchOptions: undefined,
    positionCallback: undefined,
    watcherId: 0,
    watchPosition: function (positionCallback, positionErrorCallback, watchOptions) {
        this.positionCallback = positionCallback;
        this.watchOptions = watchOptions;
        return this.watcherId;
    },
    clearWatch: function (watcherId) {
        this.watcherId = watcherId;
    }
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
        var gps = new GpsApi(geolocationMock);
        expect(gps.samples).toEqual([]);
        gps.samples = [1,2,3];
        expect(gps.samples).toNotEqual([]);
        gps.reset();
        expect(gps.samples).toEqual([]);
    });

    it("stops existing watch", function() {
        var gps = new GpsApi(geolocationMock);
        geolocationMock.watcherId = 123;
        gps.start();
        expect(geolocationMock.watcherId).toEqual(123);
        geolocationMock.watcherId = 321;
        expect(geolocationMock.watcherId).toEqual(321);
        gps.reset();
        expect(geolocationMock.watcherId).toEqual(123);

    });
});

describe("GpsApi.start()", function() {
    it("enables high accuracy", function() {
        var gps = new GpsApi(geolocationMock);
        geolocationMock.watchOptions = undefined;
        gps.start();
        expect(geolocationMock.watchOptions.enableHighAccuracy).toEqual(true);
    });

    it("stores samples", function() {
        var gps = new GpsApi(geolocationMock);
        geolocationMock.positionCallback = undefined;
        gps.start();
        expect(typeof geolocationMock.positionCallback).toEqual("function");
        // Simulate a GPS callback
        var sample = {
            "timestamp": 123,
            "coords": {
                "latitude": 12.345,
                "longitude": 67.89,
                "altitude": 135,
                "speed": 79,
                "heading": 24
            }
        };
        geolocationMock.positionCallback(sample);
        sample.timestamp = 321;
        sample.coords.latitude = 54.321;
        sample.coords.longitude = 9.876;
        geolocationMock.positionCallback(sample);
        // Both samples should be stored
        expect(gps.samples.length).toEqual(2);
        expect(gps.samples[0].ts).toEqual(123);
        expect(gps.samples[0].lat).toEqual(12.345);
        expect(gps.samples[0].lng).toEqual(67.89);
        expect(gps.samples[1].ts).toEqual(321);
        expect(gps.samples[1].lat).toEqual(54.321);
        expect(gps.samples[1].lng).toEqual(9.876);
    });
});

describe("GpsApi.stop()", function() {
    it("stops correct watcherId", function() {
        var gps = new GpsApi(geolocationMock);
        geolocationMock.watcherId = 123;
        gps.start();
        expect(geolocationMock.watcherId).toEqual(123);
        geolocationMock.watcherId = 321;
        expect(geolocationMock.watcherId).toEqual(321);
        gps.stop();
        expect(geolocationMock.watcherId).toEqual(123);
    });
});

describe("GpsApi.toBase64() and GpsApi.fromBase64()", function() {
    it("same samples after a base64 round-trip", function() {
        var stubStorageObject = {};
        var gps = new GpsApi(geolocationMock, stubStorageObject);
        geolocationMock.positionCallback = undefined;
        gps.start();
        expect(typeof geolocationMock.positionCallback).toEqual("function");
        // Simulate a GPS callback
        var sample = {
            "timestamp": 123,
            "coords": {
                "latitude": 12.345,
                "longitude": 67.89,
                "altitude": 135,
                "speed": 79,
                "heading": 24
            }
        };
        geolocationMock.positionCallback(sample);
        sample.timestamp = 321;
        sample.coords.latitude = 54.321;
        sample.coords.longitude = 9.876;
        geolocationMock.positionCallback(sample);

        var base64data = gps.toBase64();
        gps.reset();
        expect(gps.samples.length).toEqual(0);
        gps.fromBase64(base64data);

        // Both samples should be loaded
        expect(gps.samples.length).toEqual(2);
        expect(gps.samples[0].ts).toEqual(123);
        expect(gps.samples[0].lat).toEqual(12.345);
        expect(gps.samples[0].lng).toEqual(67.89);
        expect(gps.samples[1].ts).toEqual(321);
        expect(gps.samples[1].lat).toEqual(54.321);
        expect(gps.samples[1].lng).toEqual(9.876);
    });
});

describe("GpsApi.status()", function() {
    it("current status is equal to the last sample", function() {
        var gps = new GpsApi(geolocationMock);
        gps.start();
        // Simulate a GPS callback
        var sample = {
            "timestamp": 123,
            "coords": {
                "latitude": 12.345,
                "longitude": 67.89,
                "altitude": 135,
                "speed": 79,
                "heading": 24
            }
        };
        geolocationMock.positionCallback(sample);
        expect(gps.status()).toEqual(sample.coords);
        // The sample should be the current status
        sample.timestamp = 321;
        sample.coords.latitude = 54.321;
        sample.coords.longitude = 9.876;
        geolocationMock.positionCallback(sample);
        // Now the second sample should be the current status
        expect(gps.status()).toEqual(sample.coords);
    });
});

describe("GpsApi.googleMapsTrack()", function() {
    it("converts all samples to 'google.maps.LatLng' type", function() {
        var gps = new GpsApi(geolocationMock);
        gps.start();
        // Simulate a GPS callback
        var sample = {
            "timestamp": 123,
            "coords": {
                "latitude": 12.345,
                "longitude": 67.89,
                "altitude": 135,
                "speed": 79,
                "heading": 24
            }
        };
        // Add the sample
        geolocationMock.positionCallback(sample);
        sample.timestamp = 321;
        sample.coords.latitude = 54.321;
        sample.coords.longitude = 9.876;
        // Add the second sample
        geolocationMock.positionCallback(sample);
        
        googleMapsMock.trace = [];
        var googleFormat = gps.googleMapsTrack(googleMapsMock);
        expect(googleFormat).toEqual([{"lat": 12.345, "lng": 67.89}, {"lat": 54.321, "lng": 9.876}]);
        expect(googleMapsMock.trace).toEqual(["LatLng('12.345', '67.89')", "LatLng('54.321', '9.876')"]);
    });

    it("convert only new samples to 'google.maps.LatLng' type", function() {
        var gps = new GpsApi(geolocationMock);
        gps.start();
        // Simulate a GPS callback
        var sample = {
            "timestamp": 123,
            "coords": {
                "latitude": 12.345,
                "longitude": 67.89,
                "altitude": 135,
                "speed": 79,
                "heading": 24
            }
        };
        // Add the sample
        geolocationMock.positionCallback(sample);
        sample.timestamp = 321;
        sample.coords.latitude = 54.321;
        sample.coords.longitude = 9.876;
        // Add the second sample
        geolocationMock.positionCallback(sample);
        gps.googleMapsTrack(googleMapsMock);
        sample.timestamp = 567;
        sample.coords.latitude = 1.357;
        sample.coords.longitude = 7.531;
        // Add the second sample
        geolocationMock.positionCallback(sample);
        
        googleMapsMock.trace = [];
        var googleFormat = gps.googleMapsTrack(googleMapsMock);
        expect(googleFormat).toEqual([{"lat": 12.345, "lng": 67.89}, {"lat": 54.321, "lng": 9.876}, {"lat": 1.357, "lng": 7.531}]);
        expect(googleMapsMock.trace).toEqual(["LatLng('1.357', '7.531')"]);
    });
});
