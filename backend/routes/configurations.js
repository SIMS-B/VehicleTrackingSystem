const express = require('express');
const router = express.Router();

const { Configurations, validateConfig } = require('../models/configurations');   // importing model for this route

// importing middleware
const auth = require('../middleware/auth');

// importing logger
const logger = require('../startup/logger');

// ROUTES

/**
 * @swagger
 * /api/configurations:
 *  get:
 *      description: Get all configurations
 *      tags: [Configurations]
 *      responses:
 *          200: 
 *              description: Admin is able to fetch configurations successfully
 *          403:
 *              description: Customer is unauthorized to fetch configurations
 *          400:
 *              $ref: '#/components/responses/BadRequestOrInvalidToken'
 *          401:
 *              $ref: '#/components/responses/noTokenProvided'
 */
router.get('/', auth, async (req, res) => {
    try
    {
        const isAdmin = req.user.is_admin;
        
        if (isAdmin)
        {
            // admin gets access to configuration
            const defaultConfigs = await Configurations.query()
                                                        .select('po_reception', 'factory_floor', 'vin', 'chassis', 'ready_to_ship', 'arrival_at_vendor')
                                                        .where('id', '=', 1);
            
            return res.status(200).send(defaultConfigs[0]);
        }
        else
        {
            // customer is forbidden to view this information
            return res.status(403).send('You cannot access this page');    
        }
    } 
    catch (err)
    {
        // bad request
        logger.error(err)
        return res.status(400).send('Invalid data received');
    }
});

/**
 * @swagger
 * /api/configurations:
 *  post:
 *      description: Update configuration(s)
 *      tags: [Configurations]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          po_reception:
 *                              type: integer
 *                          factory_floor:
 *                              type: integer
 *                          vin:
 *                              type: integer
 *                          chassis:
 *                              type: integer
 *                          ready_to_ship:
 *                              type: integer
 *                          arrival_at_vendor:
 *                              type: integer
 *      responses:
 *          200: 
 *              description: Admin is able to update configuration(s) successfully
 *          403:
 *              description: Customer is unauthorized to fetch configurations
 *          422:
 *              description: Validation check(s) failed against new configuration(s)
 *          400:
 *              $ref: '#/components/responses/BadRequestOrInvalidToken'
 *          401:
 *              $ref: '#/components/responses/noTokenProvided'
 */
router.post('/', auth, async (req, res) => {
    try
    {
        const isAdmin = req.user.is_admin;
        
        if (isAdmin)
        {
            // admin gets access to configuration
            const newValues = req.body;
            const check = validateConfig(newValues);
            
            if (check.error != null) 
            {
                // unprocessable entity as input
                logger.error("New Config Values are Invalid!")
                return res.status(422).send(`Validation check(s) failed. ${check.error.details[0].message}`);
            }  
            else
            {
                // admin updates config values
                const updatedConfig = await Configurations.query().patch({po_reception: newValues.po_reception, factory_floor: newValues.factory_floor, vin: newValues.vin, chassis: newValues.chassis, ready_to_ship: newValues.ready_to_ship, arrival_at_vendor: newValues.arrival_at_vendor}).where('id', '=', 1)
                
                logger.info("New Config Values Saved!");
                res.status(200).send(newValues);
            }
        }
        else
        {
            // customer is forbidden to view this information
            return res.status(403).send('You cannot access this page');  
        }

    }
    catch (err)
    {
        // bad request
        logger.error(err); 
        return res.status(400).send('Invalid data received');
    }
});

module.exports = router;