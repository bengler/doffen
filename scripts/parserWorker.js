var prettyjson = require('prettyjson');
var clear = require('clear');
var parser = require('xml2json');
var fs = require('fs');
var DB = require("./dbConnection");


function ParserWorker(files, options, callback) {
  console.info("Spun up worker #" + options.workerNr);

  this.CONCURRENT_READS = 180;

  this.display = options.display;
  this.files = files;
  this.callback = callback;

  this.result = {};
  this.counts = {skipped_additional_info: 0, skipped_ted_wtfs: 0};

  this.currentReads = 0;
  this.progressDisplayInterval = 0;

  this.db = new DB();
  this.feedFiles();
}


ParserWorker.prototype.feedFiles = function() {
  if (this.currentReads === 0 && this.files.length === 0) {
    console.info("Done.");
    this.db.flush();
    this.callback(null, this.counts, this.result);
    return;
  }

  if (this.files.length > 0) {
    while (this.currentReads < this.CONCURRENT_READS && this.files.length > 0) {
      var fileName = this.files.pop();
      fs.readFile(fileName, {encoding: "utf-8" }, this.handleFileRead.bind(this));
      this.currentReads += 1;
    }
  }
  setTimeout(this.feedFiles.bind(this), 100);
};


ParserWorker.prototype.handleFileRead = function(err, data) {
  this.currentReads -= 1;
  json = this.parse(data);

  this.db.insert(json);

  for (var key in json) break;
  this.counts[key] = (typeof this.counts[key] === 'undefined' ? 1 : this.counts[key] += 1);

  // this.logSample();
};


ParserWorker.prototype.parse = function(data) {
  var jsonString = parser.toJson(data);
  return JSON.parse(jsonString);
};


ParserWorker.prototype.logSample = function() {
  this.progressDisplayInterval += 1;
  if (this.display && this.progressDisplayInterval % 100 === 0) {
    clear();
    console.log(this.files.length);
    console.log(prettyjson.render(json));
  }
};

  // if (data.indexOf("ADDITIONAL_INFORMATION_CORRIGENDUM") > 0) {
  //   counts.skipped_additional_info += 1;
  //   return;
  // }

  // if (data.indexOf("TED_ESENDERS") > 0) {
  //   counts.skipped_ted_wtfs += 1;
  //   return;
  // }


module.exports = function(files, options, callback) {
  return new ParserWorker(files, options, callback);
};
