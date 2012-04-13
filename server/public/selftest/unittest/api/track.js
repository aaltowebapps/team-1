// A mock GpsApi for testing
var gpsApiMock = {
    trace: [],
    valueBase64: "",
    reset: function () {
        this.trace.push("reset()");
    },
    start: function () {
        this.trace.push("start()");
    },
    stop: function () {
        this.trace.push("stop()");
    },
    toBase64: function () {
        this.trace.push("toBase64()");
        return this.valueBase64;
    },
    fromBase64: function (data) {
        this.trace.push("fromBase64('" + data + "')");
    },
    store: function () {
        this.trace.push("store()");
    },
    load: function () {
        this.trace.push("load()");
    }
};

// A mock XMLHttpRequest for testing
var xmlHttpRequestMock = {
    trace: [],
    open: function (method, url, asynchronous, username, password) {
        this.trace.push("open('" + method + "', '" + url + "', '" + asynchronous + "', '" + username + "', '" + password + "')");
    },
    setRequestHeader: function (name, value) {
        this.trace.push("setRequestHeader('" + name + "', '" + value + "')");
    },
    send: function (content) {
        this.trace.push("send('" + content + "')");
    }
};



describe("Track.start()", function() {
    it("resets and starts the GpsApi", function() {
        track = new Track(gpsApiMock, xmlHttpRequestMock);
        expect(gpsApiMock.trace).toEqual([]);
        track.start();
        expect(gpsApiMock.trace).toEqual(["reset()", "start()"]);
    });
});

describe("Track.save()", function() {
    it("stops tracking, sends data to server, and resets the GpsApi", function() {
        gpsApiMock.valueBase64 = "base64value";
        track = new Track(gpsApiMock, xmlHttpRequestMock);
        track.start();
        gpsApiMock.trace = [];
        track.save("track name");
        // The required order to get the right data
        expect(gpsApiMock.trace).toEqual(["stop()", "toBase64()", "reset()"]);
        // Verify that it sends the correct data to the server
        expect(xmlHttpRequestMock.trace.length).toEqual(4);
        expect(xmlHttpRequestMock.trace[0]).toMatch(/^open\('POST', '[^']+', 'false'/);
        expect(xmlHttpRequestMock.trace[1]).toEqual("setRequestHeader('Content-type', 'application/json')");
        expect(xmlHttpRequestMock.trace[2]).toEqual("setRequestHeader('Content-Length', '" + gpsApiMock.valueBase64.length + "')");
        expect(xmlHttpRequestMock.trace[3]).toEqual("send('" + gpsApiMock.valueBase64 + "')");
    });
});
