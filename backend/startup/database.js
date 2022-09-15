const { Model } = require('objection');
const Knex = require('knex');

// importing app configurations
const appConfig = require('config');

// intializing knex
const knex = Knex(appConfig.get('dbConnection'));

// giving knex object to objection
Model.knex(knex);

module.exports = knex;