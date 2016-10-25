var xlsx = require('xlsx');
var fs = require('fs');

var xlsxFile = process.argv[2];

if(typeof require !== 'undefined') XLSX = require('xlsx');
var workbook = XLSX.readFile(xlsxFile);

var first_sheet_name = workbook.SheetNames[0];
var worksheet = workbook.Sheets[first_sheet_name];

var json_sheet = XLSX.utils.sheet_to_json(worksheet);

var results = {};
var element;

var ELEMENT_TYPE = "ELEMENT"; var EMOTIONS = "EMO"; var PICTO = "PICTO"; var LANGUAGE_DEFAULT = "DEFAULT"; var LANGUAGE_FR = "FR"; var LANGUAGE_FR_FEM = "FR_FEM"; var LANGUAGE_EN = "EN"; var LANGUAGE_DE = "DE";

var ELEMENT_TYPE_ENUM = {
	DIAGNOSTIC : "DIAG",
	ANALYSE  : "ANA",
	ADVICE : "ADV"
}

var ATTRIBUTS_ELEMENT_TYPE = { "DIAG" : "diagnostic", "ANA" : "analyse", "ADV" : "advices"};

// Loop 
for(var index in json_sheet){
	element = json_sheet[index];
	var emotion;
	var text;

	
	if(element[EMOTIONS] != undefined && element[ELEMENT_TYPE] != undefined){
		emotion = element[EMOTIONS].trim();

		if(results[emotion] == undefined){
			results[emotion] = {"diagnostic" : {},"analyse":{},"advices":[]};
		}	

		text =  {"default": element[LANGUAGE_DEFAULT], "fr" :  element[LANGUAGE_FR], "fr_fem" :  element[LANGUAGE_FR_FEM], "en" :  element[LANGUAGE_EN], "de" :  element[LANGUAGE_DE] };

		node = element[ELEMENT_TYPE].trim()
		
		switch(node){
			case ELEMENT_TYPE_ENUM.DIAGNOSTIC:
			case ELEMENT_TYPE_ENUM.ANALYSE:
				results[emotion][ATTRIBUTS_ELEMENT_TYPE[node]] = {"text" : text};
			break;
			case ELEMENT_TYPE_ENUM.ADVICE:
				if(results[emotion][ATTRIBUTS_ELEMENT_TYPE[node]] == undefined){
					results[emotion][ATTRIBUTS_ELEMENT_TYPE[node]] = [];
				}

				results[emotion][ATTRIBUTS_ELEMENT_TYPE[node]].push({"text" : text, "picto" : element[PICTO]});
			break;
		}
	} 
}

fs.writeFile('../gen/diagnostic.json', JSON.stringify(results), "utf8", function (err) {
  if (err) return console.log(err);
  console.log("file is ready ../gen/diagnostic.json");
});


