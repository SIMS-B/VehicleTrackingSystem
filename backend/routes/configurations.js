const express = require('express');
const router = express.Router();

const { Configurations } = require('../models/configurations');   // importing model for this route

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

module.exports = router;