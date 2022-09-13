const express = require('express');
const router = express.Router();

const { Configurations, validateConfig } = require('../models/configurations');   // importing model for this route

// importing middleware
const auth = require('../middleware/auth');

// ROUTES

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
        console.log(err);   // remove this console log
        return res.status(400).send('Invalid data received');
    }
});

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
                return res.status(422).send(`Validation check(s) failed. ${check.error.details[0].message}`);
            }  
            else
            {
                // admin updates config values
                const updatedConfig = await Configurations.query().patch({po_reception: newValues.po_reception, factory_floor: newValues.factory_floor, vin: newValues.vin, chassis: newValues.chassis, ready_to_ship: newValues.ready_to_ship, arrival_at_vendor: newValues.arrival_at_vendor}).where('id', '=', 1)
                
                console.log(newValues);
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
        console.log(err);   // remove this console log
        return res.status(400).send('Invalid data received');
    }
});

module.exports = router;