const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const logger = require('pino')();

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
  logger.info('Initialisiere Datenbank...');
  const db = new sqlite3.Database("./minitwitter.db", (err) => {
    if (err) {
      logger.error('Fehler beim Verbinden zur Datenbank:', err.message);
    } else {
      logger.info('Verbunden zur SQLite-Datenbank.');
    }
  });

  db.serialize(() => {
    db.get(tweetsTableExists, [], async (err, row) => {
      if (err) {
        logger.error('Fehler beim Überprüfen der tweets Tabelle:', err.message);
        return;
      }
      if (!row) {
        await db.run(createTweetsTable, (err) => {
          if (err) {
            logger.error('Fehler beim Erstellen der tweets Tabelle:', err.message);
          } else {
            logger.info('tweets Tabelle erfolgreich erstellt.');
          }
        });
      }
    });
    db.get(usersTableExists, [], async (err, row) => {
      if (err) {
        logger.error('Fehler beim Überprüfen der users Tabelle:', err.message);
        return;
      }
      if (!row) {
        db.run(createUsersTable, [], async (err) => {
          if (err) {
            logger.error('Fehler beim Erstellen der users Tabelle:', err.message);
            return;
          }
          db.run(seedUsersTable, (err) => {
            if (err) {
              logger.error('Fehler beim Befüllen der users Tabelle:', err.message);
            } else {
              logger.info('users Tabelle erfolgreich befüllt.');
            }
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
      if (err) {
        logger.error('Fehler beim Einfügen in die Datenbank:', err.message);
        return reject(err);
      }
      logger.info('Eintrag erfolgreich in die Datenbank eingefügt.');
      resolve(rows);
    });
  });
};

const queryDB = (db, query, params) => {
  return new Promise((resolve, reject) => {
    db.all(query, [params], (err, rows) => {
      if (err) {
        logger.error('Fehler bei der Datenbankabfrage:', err.message);
        return reject(err);
      }
      logger.info('Datenbankabfrage erfolgreich durchgeführt.');
      resolve(rows);
    });
  });
};

const queryDBWithParams = (db, query, params) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Fehler bei der Datenbankabfrage mit Parametern:', err.message);
        return reject(err);
      }
      logger.info('Datenbankabfrage mit Parametern erfolgreich durchgeführt.');
      resolve(rows);
    });
  });
};

module.exports = { initializeDatabase, queryDB, insertDB, queryDBWithParams };
