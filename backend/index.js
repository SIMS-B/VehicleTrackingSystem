const express = require('express');
const app = express();

// importing app configurations
const config = require('config');

// importing logger
const logger = require('./startup/logger');

require("./startup/routes")(app);   // setting up routes
require("./startup/database")();    // setting up database

// setting up port number
const port = process.env.PORT || config.get('port');

// setting up the port for the application to listen to
const server = app.listen(port, (err) => {
    if (err) {
     logger.error(err);
    }
     logger.info("server is listening on port: " + port.toString());
});

module.exports = server;