#!/usr/bin/env node

var THREADS = 8;

var fs = require('fs');
var glob = require('glob');
var utils = require('./utils');

var workerFarm = require('worker-farm'),
  workers    = workerFarm(require.resolve('./parserWorker')),
  ret        = 0;

var result = {};
var metaCounts = {};


console.info("Reading files.");
files = glob.sync('data/extracted/*/*.xml');
console.info("Files found: " + files.length);

files = files.slice(0,9990);

console.info("Splitting into " + THREADS + " chunks for moar parallelism.");
chunks = utils.group(files, THREADS);

lengths = chunks.map(function(e) {
  return e.length;
});
console.info("With lengths:" + lengths);

console.info("Starting workers.");

function summarize(workerCounts) {
  console.info(workerCounts);
  Object.keys(workerCounts).map(function(key) {
    metaCounts[key] = (typeof metaCounts[key] === 'undefined' ? workerCounts[key] : metaCounts[key] += workerCounts[key]);
  });
}

function report() {
  console.info(metaCounts);
}

for (var i = 0; i < THREADS; i++) {
  workers(chunks[i], {display: i === 0, workerNr: i}, function (err, workerCounts, res) {
    summarize(workerCounts);
    if (++ret == THREADS) {
      workerFarm.end(workers);
      report();
    }
  })
}

