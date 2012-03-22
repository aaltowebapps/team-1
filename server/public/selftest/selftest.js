'use strict';

var SelfTest = {filenames: []};


SelfTest.writeDependencies = function (filenames) {
	// Jasmine
	document.write("<script src=\"selftest/external/jasmine/jasmine.js\"></script>");
	document.write("<script src=\"selftest/external/jasmine/jasmine-html.js\"></script>");
}

SelfTest.registerFiles = function (filenames) {
	SelfTest.filenames = filenames;

	SelfTest.writeDependencies();

	var filename;
	for (var i = 0; i < SelfTest.filenames.length; i++) {
		filename = SelfTest.filenames[i];
		if (filename.indexOf(".js", filename.length - 3) !== -1) {
			// Load the script itself
			document.write("<script src=\"" + filename + "\"></script>");
			// Load the test for the script
			document.write("<script src=\"selftest/unittest/" + filename + "\"></script>");
		}
	}
}

SelfTest.execute = function () {
	SelfTest.executeJasmine();
}

SelfTest.executeJasmine = function () {
	jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
	jasmine.getEnv().execute();
}
