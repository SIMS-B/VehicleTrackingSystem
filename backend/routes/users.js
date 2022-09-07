const express = require("express");
const router = express.Router();

// importing model for this route
const users = require('../models/users');  

// importing middleware
const auth = require("../middleware/auth");

// ROUTES

router.get('/', auth, async (req, res) => {
    
    // req.user contains {is_admin, id}

    try
    {
        const userId = req.user.id.toString();
        const userDetails = await users.query()
                                            .select('cnic', 'email', 'phone_number', 'registration_date')
                                            .where('id', '=', userId);

        res.status(200).send(userDetails);
    } 
    catch (err)
    {
        console.log(err);   // remove this print
    }


});

module.exports = router;