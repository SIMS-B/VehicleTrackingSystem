const express = require('express');
const router = express.Router();

const { Configurations, validateConfig } = require('../models/configurations');   // importing model for this route

// importing middleware
const auth = require('../middleware/auth');

// db connection test script 
const reading = async () => {
    const fetchAll = await Configurations.query();
    return fetchAll;
}

// ROUTES

router.get('/', async (req, res) => {
    try
    {
        
    } 
    catch (err)
    {
        console.log(err);   // remove this console log
    }
});

router.post('/', auth, async (req, res) => {
    try
    {
        const isAdmin = req.user.is_admin;
        if(isAdmin)
        {
            const newValues = req.body;
            const check = validateConfig(newValues);
            if(check.error != null) res.status(400).send(`Error: ${check.error}`);
            else
            {
                const updatedConfig = await Configurations.query().patch({po_reception: newValues.po_reception, factory_floor: newValues.factory_floor, vin: newValues.vin, chassis: newValues.chassis, ready_to_ship: newValues.ready_to_ship, arrival_at_vendor: newValues.arrival_at_vendor}).where('id', '=', 1)
                
                console.log(newValues);

                res.status(200).send(newValues);
            }
        }
        else
        {
            res.status(403).send("You cannot access this page.");
        }

    }
    catch(err)
    {
        console.log(err);
    }
});

module.exports = router;