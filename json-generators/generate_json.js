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

var LANGUAGE_MAP = [ 
{"key" : LANGUAGE_DEFAULT, "value" : "default"},
{"key" : LANGUAGE_FR, "value" : "fr"},
{"key" : LANGUAGE_EN, "value" : "en"},
{"key" : LANGUAGE_DE, "value" : "de"}]

var ELEMENT_TYPE_ENUM = {
	Q : "Q",
	N : "N",
	R : "R"
}

var CONTENT_TYPE_ENUM = {
	//QUESTIONS
	TEXT_IMAGES : "TEXT_IMAGES",
	IMAGES : "IMAGES",
	PHY : "PHY",
	QUOTES : "QUOTES",
	//QUESTIONS || RESPONSES
	TEXT : "TEXT",
	//RESPONSES
	PICTO : "PICTO",
	IMAGE : "IMAGE",
	QUOTE : "QUOTE",
	CLOUD : "CLOUD"
}

function renderText(element) {
    tradElement = {}
	for( languageIndex in LANGUAGE_MAP ) {
		languageElement = LANGUAGE_MAP[languageIndex]
		tradElement[languageElement["value"]] = element[languageElement["key"]]
	}

	return tradElement	
} 

function renderQuote(element) {
    tradElement = {"content" : {}, "author" : {}}
	for( languageIndex in LANGUAGE_MAP ) {
		languageElement = LANGUAGE_MAP[languageIndex]
		if(element[languageElement["key"]] !== undefined){
			var quotes = element[languageElement["key"]].trim().replace("[","").replace("]","");
			quotes = quotes.split(";");

			tradElement["content"][languageElement["value"]] = quotes[0]
			tradElement["author"][languageElement["value"]] = quotes[1]
		}
	}

	return tradElement	
} 

function renderCloud(element) {

	traductedCloud = []

	for( languageIndex in LANGUAGE_MAP ) {
		languageElement = LANGUAGE_MAP[languageIndex]

		var cloud = element[languageElement["key"]]
		if (cloud !== undefined){
			cloud = cloud.trim().replace("[","").replace("]","");
			cloud = cloud.split(";")

			for( i in cloud ){
				if(traductedCloud[i] === undefined) {
					traductedCloud[i] = {};
				}

				traductedCloud[i][languageElement["value"]] = cloud[i];
			}
		}
		
	}

	return traductedCloud	
}

// Loop 
for(var index in json_sheet){
	element = json_sheet[index];

	//Test if is question, id never used and question type is defined
	console.log(element)
	if(	element[ELEMENT_TYPE].trim() === ELEMENT_TYPE_ENUM.Q 
			&& currentId !== element[ID].trim()
			&& quizzMap[element[ID]] === undefined 
			&& element[CONTENT_TYPE]!== undefined
			&& (element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.TEXT //v 0.3 TEXT
				|| element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.IMAGES //IMAGES
				|| element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.TEXT_IMAGES //TEXT_IMAGES
				|| element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.PHY //PHYSIOGNOMY
				|| element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.IMAGE //ONE IMAGE
				|| element[CONTENT_TYPE] === CONTENT_TYPE_ENUM.QUOTES // QUOTES
				|| element[CONTENT_TYPE] === CONTENT_TYPE_ENUM.CLOUD // CLOUD
		)){

		currentId = element[ID].trim();

		quizzMap[currentId] = { "id" : currentId};
		if(element[EMOTIONS] !== undefined)
			quizzMap[currentId]["emotions"] = element[EMOTIONS].trim().split("-");

		quizzMap[currentId]["question"] = {};
		quizzMap[currentId]["question"]["type"] = element[CONTENT_TYPE].trim();
		if(element[CONTENT_TYPE].trim() !== CONTENT_TYPE_ENUM.IMAGES)
			quizzMap[currentId]["question"]["text"] = renderText(element);
		
		if(element[COMPL] !== undefined){
			if(element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.PHY){
				var informations = element[COMPL].trim().replace("[","").replace("]","").split(";");
				quizzMap[currentId]["question"]["area"] = {"zone" : informations[0], "position" : {"x" : informations[1], "y" : informations[2]}}
				if(informations[3] !== undefined){
					quizzMap[currentId]["question"]["area"]["icon"] = informations[3];
				}
			}else if(element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.IMAGE){
				quizzMap[currentId]["question"]["image"] = element[COMPL].trim();
			}

		}	


		quizzMap[currentId]["responses"] = [];
		
	//test if is answer, same id than last question, question is defined and is defined
	} else if( element[ELEMENT_TYPE] === ELEMENT_TYPE_ENUM.N 
			&& currentId === element[ID] 
			&& quizzMap[element[ID]] !== undefined ){
		quizzMap[currentId]["none"] = renderText(element)


	}else if( element[ELEMENT_TYPE] === ELEMENT_TYPE_ENUM.R 
			&& currentId === element[ID] 
			&& quizzMap[element[ID]] !== undefined
			&& element[CONTENT_TYPE] !== undefined){

		var response = {};
		response["type"] = element[CONTENT_TYPE].trim();

		if(element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.TEXT || element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.PICTO){
			response["text"] = renderText(element);
			if(element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.PICTO)
				response["image"] = element[COMPL].trim()
		} else if(element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.IMAGE){
			response["image"] = element[LANGUAGE_DEFAULT].trim();
		} else if(element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.QUOTE){
			response["quote"] = renderQuote(element)
		} else if(element[CONTENT_TYPE].trim() === CONTENT_TYPE_ENUM.CLOUD){
			response["cloud"] = renderCloud(element)
		}

		var quizzResponsePoints = [];

		var points = element[POINTS];
		if( points !== undefined ){
			points = element[POINTS].trim().replace("[","").replace("]","");
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


