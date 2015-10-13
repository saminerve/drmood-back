var xlsx = require('xlsx');
var fs = require('fs');

var xlsxFile = process.argv[2];

if(typeof require !== 'undefined') XLSX = require('xlsx');
var workbook = XLSX.readFile(xlsxFile);

var first_sheet_name = workbook.SheetNames[0];
var worksheet = workbook.Sheets[first_sheet_name];

var json_sheet = XLSX.utils.sheet_to_json(worksheet);

var maxId = 0; var currentId = -99;
var quizzMap = {};
var element;

var ID = "ID"; var CONTENT_TYPE = "TYPE"; var ELEMENT_TYPE = "ELEMENT"; var EMOTIONS = "EMO"; var 	POINTS = "POINTS";
var COMPL = "COMPL"; var LANGUAGE_DEFAULT = "DEFAULT"; var LANGUAGE_FR = "FR"; var LANGUAGE_EN = "EN"; var LANGUAGE_DE = "DE";

var ELEMENT_TYPE_ENUM = {
	Q : "Q",
	R : "R"
}

var CONTENT_TYPE_ENUM = {
	TEXT : "TEXT",
	IMAGE : "IMAGE"
}

// Loop 
for(var index in json_sheet){
	element = json_sheet[index];

	//Test if is question, id never used and question type is defined
	if(	element[ELEMENT_TYPE] === ELEMENT_TYPE_ENUM.Q 
			&& currentId !== element[ID] 
			&& quizzMap[element[ID]] === undefined 
			&& element[CONTENT_TYPE] !== undefined 
			&& element[CONTENT_TYPE] === CONTENT_TYPE_ENUM.TEXT){//v 0.1 select just text question
		currentId = element[ID];

		quizzMap[currentId] = { "id" : currentId};
		if(element[EMOTIONS] !== undefined)
			quizzMap[currentId]["emotions"] = element[EMOTIONS].split("-");

		quizzMap[currentId]["question"] = {};
		quizzMap[currentId]["question"]["type"] = element[CONTENT_TYPE];
		if(element[CONTENT_TYPE] === CONTENT_TYPE_ENUM.TEXT)
			quizzMap[currentId]["question"]["text"] = { "default" : element[LANGUAGE_DEFAULT], "fr" :  element[LANGUAGE_FR], "en" :  element[LANGUAGE_EN], "de" :  element[LANGUAGE_DE] };
		quizzMap[currentId]["responses"] = [];
		
	//test if is answer, same id than last question, question is defined and is defined
	} else if( element[ELEMENT_TYPE] === ELEMENT_TYPE_ENUM.R 
			&& currentId === element[ID] 
			&& quizzMap[element[ID]] !== undefined
			&& element[CONTENT_TYPE] !== undefined){

		var response = {};
		response["type"] = element[CONTENT_TYPE];
		
		if(element[CONTENT_TYPE] === CONTENT_TYPE_ENUM.TEXT){
			response["text"] = { "default" : element[LANGUAGE_DEFAULT], "fr" :  element[LANGUAGE_FR], "en" :  element[LANGUAGE_EN], "de" :  element[LANGUAGE_DE] };
		}else if(element[CONTENT_TYPE] === CONTENT_TYPE_ENUM.IMAGE){
			response["image"] = element[LANGUAGE_DEFAULT];
		}

		var quizzResponsePoints = [];

		var points = element[POINTS];
		if( points !== undefined ){
			points = element[POINTS].replace("[","").replace("]","");
			var pointsArray = points.split(";");
			
			for(var i in pointsArray){
				var effectSplit = pointsArray[i].split("=");
				quizzResponsePoints.push({"emotion" : effectSplit[0], "points" : effectSplit[1]});
			}
		}

		response["effects"] = quizzResponsePoints;

		quizzMap[currentId]["responses"].push(response);
	}
	
}

var jsonMood = [];
for( var i = 1; i <= currentId ; i++){
	if(quizzMap[i] !== undefined)
		jsonMood.push(quizzMap[i]);
}

fs.writeFile('../gen/quizz.json', JSON.stringify(jsonMood), "utf8", function (err) {
  if (err) return console.log(err);
  console.log("file is ready ../gen/quizz.json");
});


