const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sqlite3 = require('sqlite3').verbose();
const { initializeDatabase, queryDB, insertDB, queryDBWithParams } = require("./database");
const escapeHtml = require("escape-html");

const secretKey = "yourSecretKey";
let db;

const encrypt = (text, key) => {
  const cipher = crypto.createCipher("aes-256-cbc", key);
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const decrypt = (text, key) => {
  const decipher = crypto.createDecipher("aes-256-cbc", key);
  let decrypted = decipher.update(text, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
};

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token.split(" ")[1], secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = decoded;
    next();
  });
};

const authorizeUser = (req, res, next) => {
  const loggedInUser = req.user;
  const requestedUser = req.body.username || req.query.username;

  if (loggedInUser && loggedInUser.username === requestedUser) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden: Sie haben keine Berechtigung für diese Aktion." });
  }
};

const initializeAPI = async (app) => {
  try {
    db = await initializeDatabase();
    app.get("/api/feed", getFeed);
    app.post("/api/feed", verifyToken, authorizeUser, postTweet);
    app.post("/api/login", login);
    app.get("/api/protected-endpoint", verifyToken, (req, res) => {
      res.json({ message: "Dies ist ein geschützter Endpunkt", user: req.user });
    });
  } catch (error) {
    console.error("Fehler bei der Initialisierung der API:", error);
    throw new Error("Interner Serverfehler");
  }
};

const getFeed = async (req, res) => {
  const query = "SELECT * FROM tweets ORDER BY id DESC";
  try {
    const tweets = await queryDB(db, query);

    const decryptionKey = "yourDecryptionKey";
    const decryptedTweets = tweets.map(tweet => {
      return {
        ...tweet,
        text: decrypt(tweet.text, decryptionKey)
      };
    });

    res.json(decryptedTweets);
  } catch (error) {
    console.error("Fehler bei der Datenbankabfrage:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

const postTweet = async (req, res) => {
  const { username, text } = req.body;
  const encryptionKey = "yourEncryptionKey";

  const loggedInUser = req.user;
  if (loggedInUser && loggedInUser.username === username) {
    try {
      const escapedText = escapeHtml(text);

      const encryptedText = encrypt(escapedText, encryptionKey);
      await insertDB(db, `INSERT INTO tweets (username, timestamp, text) VALUES ('${username}', '${new Date().toISOString()}', '${encryptedText}')`);
      res.json({ status: "ok" });
    } catch (error) {
      console.error("Fehler bei der Datenbankeinfügung:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  } else {
    res.status(403).json({ error: "Forbidden: Sie haben keine Berechtigung, diesen Post zu erstellen." });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = ?`;
  try {
    const user = await queryDBWithParams(db, query, [username]);
    console.log(user);
    console.log(password);
    console.log(user[0].password);
    console.log(bcrypt.compareSync(password, user[0].password));
    if (user.length === 1 && bcrypt.compareSync(password, user[0].password)) {
      const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
      console.log(token);
      res.json({ user: user[0], token });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Fehler bei der Datenbankabfrage:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

module.exports = { initializeAPI };
