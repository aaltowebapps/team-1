// Create a Track that uses the GpsApi to access the GPS
Track = function (gpsApi, xmlHttpRequest) {
    'use strict';

    // Add protection for calling the constructor without 'new'
    if (!(this instanceof Track)) { return new Track(gpsApi, xmlHttpRequest); }

    this.gpsApi = gpsApi;
    this.xmlHttpRequest = xmlHttpRequest;
    this.serverUrl = "http://localhost:8080/track/UID123/";

    return this;
};

// Start a new track
Track.prototype.start = function () {
    'use strict';

    // This requires the GpsApi
    if (!this.gpsApi) { return; }

    this.gpsApi.reset();
    this.gpsApi.start();
};

// Store the track in the backend
Track.prototype.save = function (name) {
    'use strict';

    // This requires the GpsApi
    if (!this.gpsApi) { return; }

    this.gpsApi.stop();

    var data = this.gpsApi.toBase64();

    // Send the track to the backend
    this.xmlHttpRequest.open("POST", this.serverUrl + name + "/", false);
    this.xmlHttpRequest.setRequestHeader("Content-type", "application/json");
    this.xmlHttpRequest.setRequestHeader("Content-Length", data.length);
    this.xmlHttpRequest.send(data);

    this.gpsApi.reset();
};
