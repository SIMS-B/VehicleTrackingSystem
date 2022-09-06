const express = require("express");
const router = express.Router();

// importing model for this route
const users = require('../models/users');  

// db connection test script 
const reading = async () => {
    const fetchAll = await users.query(); 
    console.log(fetchAll);
}
const relationalReading = async () => {
    const fetchOrderForThisCNIC = await users.relatedQuery('Order').for('1');
    console.log(fetchOrderForThisCNIC);
}

// ROUTES

router.get('/', async (req, res) => {
    try
    {
        console.log("sample users call");
        // db connection test function
        await reading();
        await relationalReading(); 
    } 
    catch (err)
    {
        console.log(err);   // remove this console log
    }
});

module.exports = router;