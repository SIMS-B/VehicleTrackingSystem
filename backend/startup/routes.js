const express = require('express');

// importing routes
const users = require('../routes/users');
const orders = require('../routes/orders');
const configurations = require('../routes/configurations');

module.exports = function(app) {
  // setting up routes to be used against each API request
  app.use(express.json());
  app.use('/api/users', users);
  app.use('/api/orders', orders);
  app.use('/api/configurations', configurations);
};