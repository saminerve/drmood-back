var https   = require('https');
var fs = require('fs');

var file = fs.createWriteStream("file.xlsx");
var request = https.get("https://docs.google.com/spreadsheets/d/1voojZZ0vFg-js0M1W_lOrqKvBxQLE6OnltR4k9pzTtk/edit?usp=sharing", function(response) {
  response.pipe(file);
});