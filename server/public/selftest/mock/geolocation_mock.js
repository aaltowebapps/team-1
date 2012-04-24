// Create a mock geolocation Api
GeolocationMock = function () {
    'use strict';

    // Add protection for calling the constructor without 'new'
    if (!(this instanceof GeolocationMock)) { return new GeolocationMock(); }

    this.positionCallback = undefined;
    this.positionErrorCallback = undefined;
    this.watchOptions = undefined;
    this.watcherId = 123;

    var s = function(lat, lng, alt, spd, dir) {
        return {
            "timestamp": 0,
            "coords": { "latitude": lat, "longitude": lng, 
                "altitude": alt, "speed": spd, "heading": dir }
        };
    }

    this.sampleIndex = 0;
    this.samples = [
        s(60.18094906780875, 24.832674264907837, 0, 1.4, 0),
        s(60.180997083201014, 24.832663536071777, 0, 1.4, 0),
        s(60.18103709597428, 24.832679629325867, 0, 1.4, 0),
        s(60.181077108698794, 24.832679629325867, 0, 1.4, 0),
        s(60.18111978888452, 24.832663536071777, 0, 1.4, 0),
        s(60.18115446649458, 24.832642078399658, 0, 1.4, 0),
        s(60.18117847404933, 24.8326313495636, 0, 1.4, 0),
        s(60.181210484095025, 24.83259916305542, 0, 1.4, 0),
        s(60.18123449160881, 24.83256161212921, 0, 1.4, 0),
        s(60.181253164107424, 24.832534790039062, 0, 1.4, 0),
        s(60.1812745040928, 24.832481145858765, 0, 1.4, 0),
        s(60.18128250658376, 24.83237385749817, 0, 1.4, 0),
        s(60.181279839086976, 24.83231484889984, 0, 1.4, 0),
        s(60.1812718365954, 24.832250475883484, 0, 1.4, 0),
        s(60.18126383410184, 24.832191467285156, 0, 1.4, 0),
        s(60.18124782910889, 24.83213245868683, 0, 1.4, 0),
        s(60.181239826609506, 24.8320734500885, 0, 1.4, 0),
        s(60.18122915660728, 24.831998348236084, 0, 1.4, 0),
        s(60.18122382160485, 24.831933975219727, 0, 1.4, 0),
        s(60.18120514908957, 24.83189105987549, 0, 1.4, 0),
        s(60.181183809059114, 24.831799864768982, 0, 1.4, 0),
        s(60.181175806544125, 24.831730127334595, 0, 1.4, 0),
        s(60.18117047153302, 24.831687211990356, 0, 1.4, 0),
        s(60.181157134001545, 24.83163893222809, 0, 1.4, 0),
        s(60.18114379646462, 24.83157455921173, 0, 1.4, 0),
        s(60.18113312643119, 24.831494092941284, 0, 1.4, 0),
        s(60.18112512390384, 24.831435084342957, 0, 1.4, 0),
        s(60.18111978888452, 24.83134925365448, 0, 1.4, 0),
        s(60.18109311377495, 24.831247329711914, 0, 1.4, 0),
        s(60.181074441185345, 24.831172227859497, 0, 1.4, 0),
        s(60.18105310106992, 24.83108103275299, 0, 1.4, 0),
        s(60.18103176094066, 24.831016659736633, 0, 1.4, 0),
        s(60.181007753278664, 24.830930829048157, 0, 1.4, 0),
        s(60.18098908064051, 24.83086109161377, 0, 1.4, 0),
        s(60.18094373276083, 24.83083426952362, 0, 1.4, 0),
        s(60.1809143899818, 24.83083963394165, 0, 1.4, 0),
        s(60.18088504717652, 24.8308664560318, 0, 1.4, 0),
        s(60.18081835888524, 24.830898642539978, 0, 2.8, 0),
        s(60.18077301076979, 24.830930829048157, 0, 2.8, 0),
        s(60.18071165733748, 24.831016659736633, 0, 2.8, 0),
        s(60.18066630907468, 24.83112931251526, 0, 2.8, 0),
        s(60.18068231435106, 24.83131170272827, 0, 2.8, 0),
        s(60.18071965996557, 24.831526279449463, 0, 2.8, 0),
        s(60.180757005537636, 24.831703305244446, 0, 2.8, 0),
        s(60.180783680920236, 24.831912517547607, 0, 2.8, 0),
        s(60.18082102641948, 24.83213782310486, 0, 2.8, 0),
        s(60.18085570434505, 24.83235776424408, 0, 2.8, 0),
        s(60.18092772761188, 24.832534790039062, 0, 2.8, 0),
        s(60.18092772761188, 24.832663536071777, 0, 2.8, 0)
    ];

    return this;
};

GeolocationMock.prototype.getCurrentPosition = function (successCallback, errorCallback, options) {
	if (this.sampleIndex >= this.samples.length) { this.sampleIndex = 0; }
	this.samples[this.sampleIndex].timestamp = new Date().getTime();
	successCallback(this.samples[this.sampleIndex]);
	this.sampleIndex = this.sampleIndex + 1;
};

GeolocationMock.prototype.watchPosition = function (positionCallback, positionErrorCallback, watchOptions) {
    'use strict';

    var that = this;
    this.positionCallback = positionCallback;
    this.positionErrorCallback = positionErrorCallback;
    this.watchOptions = watchOptions;

    var updateCoordinates = function () {
        that.getCurrentPosition(that.positionCallback, that.positionErrorCallback, that.watchOptions);
    }
    setInterval(updateCoordinates, 1000);

    return this.watcherId;
};

GeolocationMock.prototype.clearWatch = function (watcherId) {
    'use strict';

    if (watcherId == this.watcherId) {
        this.positionCallback = undefined;
        this.positionErrorCallback = undefined;
        this.watchOptions = undefined;
    }
};
