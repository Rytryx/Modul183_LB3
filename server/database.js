const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

const tweetsTableExists =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='tweets'";
const createTweetsTable = `CREATE TABLE tweets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  timestamp TEXT,
  text TEXT
)`;
const usersTableExists =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
const createUsersTable = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  password TEXT
)`;
const seedUsersTable = `INSERT INTO users (username, password) VALUES
  ('switzerchees', '${bcrypt.hashSync('123456', 10)}'),
  ('john', '${bcrypt.hashSync('123456', 10)}'),
  ('jane', '${bcrypt.hashSync('123456', 10)}')
`;

const initializeDatabase = async () => {
  const db = new sqlite3.Database("./minitwitter.db");

  db.serialize(() => {
    db.get(tweetsTableExists, [], async (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }
      if (!row) {
        await db.run(createTweetsTable, (err) => {
          if (err) console.error(err.message);
        });
      }
    });
    db.get(usersTableExists, [], async (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }
      if (!row) {
        db.run(createUsersTable, [], async (err) => {
          if (err) {
            console.error(err.message);
            return;
          }
          db.run(seedUsersTable, (err) => {
            if (err) console.error(err.message);
          });
        });
      }
    });
  });

  return db;
};

const insertDB = (db, query) => {
  return new Promise((resolve, reject) => {
    db.run(query, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const queryDB = (db, query, params) => {
  return new Promise((resolve, reject) => {
    db.all(query, [params], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const queryDBWithParams = (db, query, params) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

module.exports = { initializeDatabase, queryDB, insertDB, queryDBWithParams };
