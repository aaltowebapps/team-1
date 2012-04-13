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


describe("GpsApi.store() and GpsApi.load()", function() {
    it("same samples after storing and loading", function() {
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

        gps.store();
        gps.reset();
        expect(gps.samples.length).toEqual(0);
        gps.load();

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

