#!/usr/bin/env node

var fs = require('fs');
var sh = require('execSync');

files = fs.readdirSync('data/doffin/');

files.map(function(file) {
  var dirName = file.replace(/\.zip/gi, '');
  var result = sh.exec('7z x -odata/extracted/'+dirName+' data/doffin/'+file);
  console.log('return code ' + result.code);
  console.log('stdout + stderr ' + result.stdout);
});

