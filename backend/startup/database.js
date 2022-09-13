const { Model } = require('objection');
const Knex = require('knex');

// importing app configurations
const config = require('config');

// intializing knex
const knex = Knex(config.get('dbConnection'));

// giving knex object to objection
Model.knex(knex);

module.exports = knex;