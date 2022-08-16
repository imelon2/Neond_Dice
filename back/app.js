const express = require("express");
const cors = require("cors");
const app = express();
const network = require('./soket/networks')
const routes = require('./routes');


app.use(cors());
app.use(express.json());

app.use('/',routes);

app.get('/', (req, res) => {
    res.status(200).send('Welcome NoenD !!');
  });


app.use((req, res, next) => {
  res.status(404).send("Not Found!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    message: "Internal Server Error",
    stacktrace: err.toString(),
  });
});

const port = 3001;

app.listen(port, () => {
  console.log(`[RUN] StatesAirline Server... | http://localhost:${port}`);
});

network();

module.exports = app;
