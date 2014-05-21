var r = require('rethinkdb');
var Promise = require('bluebird');

var DB_LOG_PREAMBLE = "   * DB * ";



function DbConnection(database) {
  this.database = database;
  this.connectionPromise = this.init(database);
}


DbConnection.prototype.init = function(database) {
  return new Promise( function(resolve, reject) {
    opts = { host: 'localhost',
      port: 28015,
      db: database,
      authKey: '' };

    r.connect(opts, function(err, conn) {
        if (err) return reject(err);
        resolve(conn);
      });
  });
};


DbConnection.prototype.scrub = function() {
  this.connectionPromise.then(function (conn) {
    console.info(DB_LOG_PREAMBLE + "Dropping table");
    r.db(this.database).tableDrop('doffin').run(conn, this.handleError.bind(this));
    console.info(DB_LOG_PREAMBLE + "Creating table");
    r.db(this.database).tableCreate('doffin').run(conn, this.handleError.bind(this));
  }.bind(this));
};


DbConnection.prototype.insert = function(json) {
};

DbConnection.prototype.handleError = function(err, conn) {
  if (err) {
    console.info (DB_LOG_PREAMBLE + " !!!GAAARGH!!! " + err);
  }
};

module.exports = DbConnection;