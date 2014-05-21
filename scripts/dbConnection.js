var r = require('rethinkdb');
var Promise = require('bluebird');

var DB_LOG_PREAMBLE = "   * DB * ";
var DB_NAME = "test";
var DB_TABLE_NAME = "doffin";

var FLUSH_AT_QUEUE_LENGTH = 1000;

function DbConnection() {
  this.connectionPromise = this.init();
  this.queue = [];
}


DbConnection.prototype.init = function(options) {
  return new Promise( function(resolve, reject) {
    opts = { host: 'localhost',
      port: 28015,
      db: DB_NAME,
      authKey: '' };

    r.connect(opts, function(err, conn) {
        if (err) {
          this.consoleLog(err);
          return reject(err);
        }
        resolve(conn);
      }.bind(this));
  });
};

DbConnection.prototype.consoleLog = function(str) {
  console.log(DB_LOG_PREAMBLE + str);
};

DbConnection.prototype.close = function(callback) {
  this.connectionPromise.then(function (conn) {
    this.consoleLog("Closing connection");
    conn.close(callback);
  }.bind(this));
};

DbConnection.prototype.scrub = function() {
  return new Promise(function (resolve, reject) {
    this.connectionPromise.then(function (conn) {
        r.db(DB_NAME).tableDrop(DB_TABLE_NAME).run(conn, function(err, _conn) {
          this.consoleLog("Dropped table");
          r.db(DB_NAME).tableCreate(DB_TABLE_NAME).run(conn, function(err, _conn) {
            this.consoleLog("Created table");
            if (err) {
              this.consoleLog(err);
              return reject(err);
            }
            resolve(conn);
          }.bind(this));
        }.bind(this));
    }.bind(this));
  }.bind(this));
};


DbConnection.prototype.flush = function() {
  this.connectionPromise.then(function (conn) {

    r.db(DB_NAME).table(DB_TABLE_NAME).insert(this.queue, {durability: "soft", returnVals: false}).run(conn, this.handleError.bind(this));
    this.queue = [];

  }.bind(this));
};

DbConnection.prototype.insert = function(json) {
  this.queue.push(json);
  if (this.queue.length == FLUSH_AT_QUEUE_LENGTH) {
    this.flush();
  }
};


DbConnection.prototype.handleError = function(err, conn) {
  if (err) {
    this.consoleLog(" !!!GAAARGH!!! " + err);
  }
};

module.exports = DbConnection;
