const express = require('express');
const router = express.Router();

const { Configurations } = require('../models/configurations');   // importing model for this route

// db connection test script 
const reading = async () => {
    const fetchAll = await Configurations.query(); 
    console.log(fetchAll);
}

// ROUTES

router.get('/', async (req, res) => {
    try
    {
        console.log('sample configurations call');
        await reading(); // db connection test function
    } 
    catch (err)
    {
        console.log(err);   // remove this console log
    }
});

module.exports = router;