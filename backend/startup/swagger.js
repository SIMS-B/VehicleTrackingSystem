const swaggerJsDoc = require('swagger-jsdoc');

// importing app configurations
const config = require('config');

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'VTS',
            version: '1.0.0',
        },
        servers: [
            {
                url: config.get('swaggerServerURL')    // put this in config
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: config.get('swaggerBearerAuth')
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

module.exports = swaggerSpecs;