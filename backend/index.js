const express = require('express');
const app = express();

// importing and setting up swagger
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'VTS',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:8080'    // put this in config
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            responses: {
                noTokenProvided: {
                    description: 'Access token not provided'
                },
                BadRequestOrInvalidToken: {
                    description: 'Bad request or invalid token provided'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]  
    },
    apis: ["./routes/*.js"],  // update path after refactoring
};

const swaggerSpecs = swaggerJsDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// importing app configurations
const config = require('config');

require("./startup/routes")(app);   // setting up routes
require("./startup/database")();    // setting up database

// setting up port number
const port = process.env.PORT || config.get('port');

// setting up the port for the application to listen to
const server = app.listen(port, (err) => {
    if (err) {
     console.error(err);
    }
     console.log(`server is listening on ${port}`);
});

// module.exports = server;