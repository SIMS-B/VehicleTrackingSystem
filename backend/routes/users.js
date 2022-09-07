const express = require('express');
const router = express.Router();

// importing model for this route
const { Users, validatePassword } = require('../models/users');  

// importing middleware
const auth = require('../middleware/auth');

// ROUTES

router.get('/', auth, async (req, res) => {
    
    // req.user contains {is_admin, id}

    try
    {
        const userId = req.user.id.toString();
        const userDetails = await Users.query()
                                            .select('cnic', 'email', 'phone_number', 'registration_date')
                                            .where('id', '=', userId);

        res.status(200).send(userDetails);
    } 
    catch (err)
    {
        console.log(err);   // remove this print
    }


});

router.put('/', auth, async (req, res) => {
    
    // req.user contains {is_admin, id}
    // req.body contains {oldPassword, newPassword}
    try
    {
        const userId = parseInt(req.user.id);
        const oldPassword = req.body.oldPassword.toString();
        const newPassword = req.body.newPassword.toString();

        // check if oldPassword is same as in db
        const oldPasswordInDb = await Users.query()
                                            // .select('password')
                                            .where('id', '=', userId);

        const oldPasswordToCompare = oldPasswordInDb[0].password.toString();
        
        if (oldPassword == oldPasswordToCompare)
        {
            // validate new password against password validation checks
            const passwordValidationCheck = validatePassword( {pwd: newPassword} ); 

            if (passwordValidationCheck.error == null)
            {
                // update the old password with new one in db
                const updatedUser = await Users.query()
                                                    .patch({ password: newPassword })
                                                    .where('id', '=', userId);

                res.status(200).send('Password changed sucessfully');
            }
            else
            {
                res.status(400).send(`Invalid new password. ${passwordValidationCheck.error}`);
            }
        }
        else
        {
            res.status(400).send('Invalid old password');
        }
    } 
    catch (err)
    {
        console.log(err);   // remove this print
    }


});

module.exports = router;