const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const Joi = require('joi');



// importing model for this route
const { Users, validatePassword } = require('../models/users');  

// importing middleware
const auth = require('../middleware/auth');

// generate Jwt

const generateJwt = async (query) => {
    const token = await jwt.sign({is_admin: query.is_admin, id: query.id}, 'jwtPrivateKey');
    if(query.is_admin) console.log("Admin logged in.");
    else console.log("User logged in.");
    return token;
}

// LOGIN function

const inputValid = async (creds) => {
   
    let check, validateQuery, query;

    if(creds.email == undefined)
    {
        check = await validateUser(creds);
        if(check.error) return false;
        else {
            validateQuery = await users.query().findOne('cnic', '=', creds.cnic);
        }
    }
    else if(creds.email != undefined)
    {
        check = await validateAdmin(creds);
        if(check.error) return false;
        else {
            validateQuery = await users.query().findOne('email', '=', creds.email); 

        }}
    return await dbValid(check, validateQuery);
    }

// validation from database

const dbValid = async (creds, validateQuery) => {

        if(creds.password == validateQuery.password) return validateQuery;
        else return false;

}

// joi validate

const validateAdmin = async (creds) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(5).max(20)
    })  
    return await Joi.validate(creds, schema);
  }
  
const validateUser = async (creds) => {
  
    const schema = Joi.object({
        cnic: Joi.number().required(),
        password: Joi.string().min(5).max(20)
    }) 
  
    return await Joi.validate(creds, schema);
  }

// ROUTES

router.get('/', auth, async (req, res) => {
    
    // req.user contains {is_admin, id}

    try
    {
        const userId = req.user.id.toString();
        const userDetails = await Users.query()
                                            .select('cnic', 'email', 'phone_number', 'registration_date')
                                            .where('id', '=', userId);

        return res.status(200).send(userDetails);
    } 
    catch (err)
    {
        console.log(err);   // remove this print
        return res.status(400).send('Some error occured');
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
                                            .select('password')
                                            .where('id', '=', userId);

        const oldPasswordToCompare = oldPasswordInDb.toString();
        
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

                return res.status(200).send('Password changed sucessfully');
            }
            else
            {
                return res.status(400).send(`Invalid new password. ${passwordValidationCheck.error}`);
            }
        }
        else
        {
            return res.status(400).send('Invalid old password');
        }
    } 
    catch (err)
    {
        console.log(err);   // remove this print
        return res.status(400).send('Some error occured');
    }
});

router.post('/login', async(req, res) => {
    try{
        const logCreds = req.body;
        const result = await inputValid(logCreds);
        token = await generateJwt(result)
        if(!token) res.send(400);
        else res.status(200).send(token);
        
    }
    catch (err)
    {
        console.log(err);
    }
});

module.exports = router;