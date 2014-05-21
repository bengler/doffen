#!/usr/bin/env node

var fs = require("fs");
var glob = require("glob");
var utils = require("./utils");
var db = require("./dbConnection");

var THREAD_COUNT = 1;


function Parser() {
  this.result = {};
  this.counts = {};

  console.info("Reading files.");

  var files = glob.sync('data/extracted/*/*.xml');

  console.info("Files found: " + files.length);

  files = files.slice(0,9990);

  console.info("Splitting into " + THREAD_COUNT + " chunks for moar parallelism.");
  chunks = utils.group(files, THREAD_COUNT);
  lengths = chunks.map(function(e) {
    return e.length;
  });

  console.info("With lengths:" + lengths + "\n\n");

  var scrubPromise = db.scrub();
  console.info(scrubPromise);

  this.workerFarm = require('worker-farm');
  this.workers = this.workerFarm(require.resolve('./parserWorker'));
  this.returnedWorkers = 0;

  console.info("Waiting for DB.");
  scrubPromise.then(this.runWorkers.bind(this));
}

Parser.prototype.runWorkers = function() {
  console.info("Starting workers…");
  for (var i = 0; i < THREAD_COUNT; i++) {
    this.workers(chunks[i], {display: i === 0, workerNr: i}, this.handleWorkerDone.bind(this));
  }
};


Parser.prototype.handleWorkerDone = function(err, workerCounts, workerResult) {
  this.summarize(workerCounts);
  if (++this.returnedWorkers == THREAD_COUNT) {
    this.workerFarm.end(this.workers);
    this.report();
    db.close();
  }
};


Parser.prototype.summarize = function(workerCounts) {
  Object.keys(workerCounts).map(function(key) {
    if (typeof this.counts[key] === 'undefined') {
      this.counts[key] = workerCounts[key];
    } else {
      this.counts[key] += workerCounts[key];
    }
  }.bind(this));
};


Parser.prototype.report = function() {
  console.info(this.counts);
};

new Parser();