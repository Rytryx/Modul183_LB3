const express = require("express");
const http = require("http");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { initializeAPI } = require("./api");

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100, 
  message: "Zu viele Anfragen von dieser IP-Adresse. Versuchen Sie es später erneut.",
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
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

const serverPort = process.env.PORT || 3000;
server.listen(serverPort, () => {
  console.log(`Express Server started on port ${serverPort}`);
});
