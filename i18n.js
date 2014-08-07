/*
	just-i18n package for Meteor.js
	author: Hubert OG <hubert@orlikarnia.com>
*/

var maps			= {};
var language		= '';
var defaultLanguage = 'en';
var missingTemplate = '';
var showMissing		= false;
var dep				= new Deps.Dependency();

/*
	Convert key to internationalized version
*/

isOfType = function(item, type) {
	return (typeof item === type);
}

i18n = function() {

	dep.depend();

	var label;
	var args = _.toArray(arguments);

	/* remove extra parameter added by blaze */
	if (typeof args[args.length-1] === 'object') {
		args.pop(); 
	}

	var label = args[0];
	args.shift();
	
	var data = args[0] ? args[0] : {}
	  , addedField = args[1] && isOfType(args[1], 'string') ? args[1] : null
	  , forcedLanguage = args[2] && isOfType(args[2], 'string') ? args[2] : null;

	if (addedField) label = label + '.' + addedField;
	if (!isOfType(label, 'string')) return '';

	var defaultText = maps[defaultLanguage] && maps[defaultLanguage][label] ? maps[defaultLanguage][label] : '';
	var str = (maps[forcedLanguage] && maps[forcedLanguage][label]) ||
			  (maps[language] && maps[language][label]) ||
			  (showMissing && _.template(missingTemplate, {language: language, defaultLanguage: defaultLanguage, label: label, defaultText: defaultText})) ||
			  '';
	str = replaceWithObj(str, data);
	return str;

};

/*
	Register handlebars helper
*/

if (Meteor.isClient) {
	if (UI) {
		UI.registerHelper('i18n', function () {
			return i18n.apply(this, arguments);
		});
	} else if (Handlebars) {
		Handlebars.registerHelper('i18n', function () {
			return i18n.apply(this, arguments);
		});
	}
}

function replaceWithParams(string, params) {
	var formatted = string;
	
	params.forEach(function(param , index){
		var pos = index + 1;
		formatted = formatted.replace("{$" + pos + "}", param);
	});

	return formatted;
};

function replaceWithObj(string, data) {
	
	var formatted = string;
	if (isOfType(data, 'object')) {
		var flattened = data ? flattenJSON(data) : {};	
		for (var k in flattened) {
			formatted = formatted.replace("[[" + k + "]]", flattened[k]);		
		}
	} else {
		formatted = formatted.replace(/\[\[(.*?)\]\]/ig, data);
	}

	return formatted;

};

/*
	Settings
*/

i18n.setLanguage = function(lng) {
	language = lng;
	dep.changed();
};

i18n.setDefaultLanguage = function(lng) {
	defaultLanguage = lng;
	dep.changed();
};

i18n.getLanguage = function() {
	dep.depend();
	return language;
};

i18n.showMissing = function(template) {
	if (template) {
		if (typeof template === 'string') {
			missingTemplate = template;
		} else {
			missingTemplate = '[<%= label %>]';
		}
		showMissing = true;
	} else {
		missingTemplate = '';
		showMissing = false;
	}
};

/*
	Register map
*/

i18n.map = function(language, map) {
	if (!maps[language]) maps[language] = {};
	registerMap(language, '', false, map);
	dep.changed();
};

var registerMap = function(language, prefix, dot, map) {
	if (typeof map === 'string') {
		maps[language][prefix] = map;
	} else if (typeof map === 'object') {
		if (dot) prefix = prefix + '.';
		_.each(map, function(value, key) {
			registerMap(language, prefix + key, true, value);
		});
	}
};