'use strict';

var SelfTest = {filenames: []};

SelfTest.readFile = function (filename) {
	var xmlhttp;
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	} else { // code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	try {
		xmlhttp.open("GET", filename, false);
		xmlhttp.send();
	} catch (e) {
		// This is expected to fail for "file://" on Chrome
		return undefined;
	}
	return xmlhttp.responseText;
}

SelfTest.writeDependencies = function (filenames) {
	// JSLint
	document.write("<script src=\"selftest/external/jslint/jslint.js\"></script>");
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
	SelfTest.executeJslint();
	SelfTest.executeJasmine();
}

SelfTest.executeJslint = function () {
	SelfTest.writeJslintBanner();
	document.write("<div class=\"show-passed\">");
	var filename;
	var content;
	var options = null;
	for (var i = 0; i < SelfTest.filenames.length; i++) {
		filename = SelfTest.filenames[i];
		content = SelfTest.readFile(filename);
		if (content === undefined) {
			SelfTest.writeCouldNotLoadFile(filename);
		} else {
			if (JSLINT(content, options)) {
				SelfTest.writeJslintPassed(filename);
			} else {
				SelfTest.writeJslintReport(filename);
			}
		}
	}
	document.write("</div>");
}

SelfTest.writeJslintBanner = function () {
	document.write("<div class=\"banner\" style=\"height: 19px\">");
	document.write("	<div class=\"logo\">");
	document.write("		<span class=\"title\">JSLint</span>");
	document.write("	</div>");
	document.write("</div>");
}

SelfTest.writeCouldNotLoadFile = function (filename) {
	document.write("<div class=\"suite failed\">");
	document.write("	<a class=\"description\" href=\"" + filename + "\">" + filename + "</a>");
	document.write("	<div class=\"spec failed\">");
	document.write("		<div class=\"description\">Could not load the file!</div>");
	document.write("	</div>");
	document.write("</div>");
}

SelfTest.writeJslintPassed = function (filename) {
	document.write("<div class=\"suite passed\">");
	document.write("	<a class=\"description\" href=\"" + filename + "\">" + filename + "</a> passed!");
	document.write("</div>");
}

SelfTest.writeJslintReport = function (filename) {
	document.write("<div class=\"suite failed\">");
	document.write("	<a class=\"description\" href=\"" + filename + "\">" + filename + "</a>");
	document.write("	<div class=\"spec failed\">");
	document.write("		<div class=\"description\">JSLint found problems</div>");
	document.write("		<div class=\"messages\">");
	document.write("			<div class=\"resultMessage fail\">" + JSLINT.report() + "</div>");
	document.write("		</div>");
	document.write("	</div>");
	document.write("</div>");
}

SelfTest.executeJasmine = function () {
	jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
	jasmine.getEnv().execute();
}
