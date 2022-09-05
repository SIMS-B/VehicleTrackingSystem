const { Model } = require('objection');
const Knex = require('knex');

// intializing knex
const knex = Knex({
    client: 'postgres',
    connection: {
        host: 'ec2-34-231-63-30.compute-1.amazonaws.com',
        database: 'd6qp7gj6sg1pq1',
        user: 'juwafsxqosjebt',
        password: '8e63a48a2f7d76da3272ac5fbc737c9d1ae19f93ba39629748d2c444b3623aa3',
        ssl: { require: false, rejectUnauthorized: false }
    }
});

// giving knex object to objection
Model.knex(knex);

module.exports = knex;