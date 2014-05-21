var r = require('rethinkdb');
var Promise = require('bluebird');

var DB_LOG_PREAMBLE = "   * DB * ";
var DB_NAME = "test";
var DB_TABLE_NAME = "doffin";

function DbConnection() {
  this.connectionPromise = this.init();
}


DbConnection.prototype.init = function() {
  return new Promise( function(resolve, reject) {
    opts = { host: 'localhost',
      port: 28015,
      db: DB_NAME,
      authKey: '' };

    r.connect(opts, function(err, conn) {
        if (err) return reject(err);
        resolve(conn);
      });
  });
};

DbConnection.prototype.consoleLog = function(str) {
  console.log(DB_LOG_PREAMBLE + str);
};

DbConnection.prototype.close = function() {
  this.connectionPromise.then(function (conn) {
    this.consoleLog("Closing connection");
    conn.close();
  }.bind(this));
};

DbConnection.prototype.scrub = function() {
  this.connectionPromise.then(function (conn) {
    this.consoleLog("Dropping table");
    r.db(DB_NAME).tableDrop(DB_TABLE_NAME).run(conn, this.handleError.bind(this));
    this.consoleLog("Creating table");
    r.db(DB_NAME).tableCreate(DB_TABLE_NAME).run(conn, this.handleError.bind(this));
  }.bind(this));
};


DbConnection.prototype.insert = function(json) {
  this.connectionPromise.then(function (conn) {
    r.db(DB_NAME).table(DB_TABLE_NAME).insert(json).run(conn, this.handleError.bind(this));
  }.bind(this));
};


DbConnection.prototype.handleError = function(err, conn) {
  if (err) {
    this.consoleLog(" !!!GAAARGH!!! " + err);
  }
};

module.exports = new DbConnection();
