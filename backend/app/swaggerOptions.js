const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Epic Road Trip',
            version: '1.0.0',
            description: 'Voici une documentation SWAGGER pour vous aider à utiliser notre api !',
        },
    },
    apis: ["./app/routes/*.js"],
};


const specs = swaggerJsdoc(options);

module.exports = specs;
