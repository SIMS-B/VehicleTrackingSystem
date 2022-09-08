const express = require('express');
const router = express.Router();

const { Configurations } = require('../models/configurations');   // importing model for this route

// importing middleware
const auth = require('../middleware/auth');

// db connection test script 
const reading = async () => {
    const fetchAll = await Configurations.query().select('po_reception', 'factory_floor', 'vin', 'chassis', 'ready_to_ship', 'arrival_at_vendor')
    .where('id', '=', 1);
    return fetchAll;
}

// ROUTES

router.get('/', auth, async (req, res) => {
    try
    {
        const isAdmin = req.user.is_admin;
        if(isAdmin)
        {
        console.log('sample configurations call');
        const defaultConfigs = await reading();
        res.status(200).send(defaultConfigs[0]);
        }
        else
        {
            res.status(403).send("You cannot access this page.");
        }
        
    } 
    catch (err)
    {
        console.log(err);   // remove this console log
    }
});

module.exports = router;