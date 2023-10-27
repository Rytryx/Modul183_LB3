const express = require("express");
const http = require("http");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { initializeAPI } = require("./api");
const pino = require('pino');
const pinoHttp = require('pino-http');

const app = express();
app.use(express.json());

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const expressLogger = pinoHttp({ logger });

app.use(expressLogger);

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100, 
  message: "Zu viele Anfragen von dieser IP-Adresse. Versuchen Sie es später erneut.",
  onLimitReached: (req, res, options) => {
    logger.warn(`Rate limit erreicht: ${req.ip}`);
  }
});

app.use(limiter);

app.disable("x-powered-by");

app.use(morgan("combined"));

const server = http.createServer(app);

initializeAPI(app);

app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Internal Server Error");
});

const serverPort = process.env.PORT || 3000;
server.listen(serverPort, () => {
  logger.info(`Express Server gestartet auf Port ${serverPort}`);
});
