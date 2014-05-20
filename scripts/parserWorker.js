
var CONCURRENT_READS = 180;

var prettyjson = require('prettyjson');
var clear = require('clear');
var parser = require('xml2json');
var fs = require('fs');

var files = [];
var display = false;
var callBack = null;

var currentReads = 0;
var progressDisplayInterval = 0;

var result = {};
var metaCounts = {skipped_additional_info: 0, skipped_ted_wtfs: 0};


function parse(err, data) {
  currentReads -= 1;

  // if (data.indexOf("ADDITIONAL_INFORMATION_CORRIGENDUM") > 0) {
  //   metaCounts.skipped_additional_info += 1;
  //   return;
  // }

  // if (data.indexOf("TED_ESENDERS") > 0) {
  //   metaCounts.skipped_ted_wtfs += 1;
  //   return;
  // }

  var jsonString = parser.toJson(data);
  json = JSON.parse(jsonString);

  for (var key in json) break;
  metaCounts[key] = (typeof metaCounts[key] === 'undefined' ? 1 : metaCounts[key] += 1);

  progressDisplayInterval += 1;

  if (display && progressDisplayInterval % 100 === 0) {
    clear();
    console.log(files.length);
    console.log(prettyjson.render(json));
  }
};


function feedFiles() {
  if (currentReads === 0 && files.length === 0) {
    console.info("Done.");
    callback(null, metaCounts, result);
    return;
  }

  if (files.length > 0) {
    while (currentReads < CONCURRENT_READS && files.length > 0) {
      var fileName = files.pop();
      fs.readFile(fileName, {encoding: "utf-8" }, parse);
      currentReads += 1;
    }
  }

  setTimeout(function() {
    feedFiles();
  }, 50);
};

function init(_files, options, _callback) {
  files = _files;
  display = options.display;
  callback = _callback;
  console.info("Spun up worker #" + options.workerNr);
  feedFiles();
};

module.exports = init;

