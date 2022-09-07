const express = require("express");
const jwt = require("jsonwebtoken");
const { knex } = require("../models/users");
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

// generate Jwt

const generateJwt = async (is_admin) => {
    const token = await jwt.sign({_admin: is_admin}, 'jwtPrivateKey');
    if(is_admin) console.log("Admin logged in.");
    else console.log("User logged in.");
    return token;
}


// LOGIN function

const userLogin = async (creds) => {
    // checking type of user

    // if(creds.email == null && creds.cnic != null)
    // {
    // const validate = await users.query().findOne('cnic', '=', creds.cnic);
    // if(!validate.is_admin) console.log("user login successful");
    // }
    // else if(creds.cnic == null && creds.email != null)
    // {
    // const validate = await users.query().findOne('email', '=', creds.email);
    // if(validate.is_admin) console.log("admin login successful");
    // }
    // else
    // {
    //     console.log("input is required!");
    // }

    //alternative method

    console.log(creds.password);

    if(typeof creds.login === "string") {
        validate = await users.query().findOne('email', '=', creds.login);   
    }
    else if(typeof creds.login === "number") {
        validate = await users.query().findOne('cnic', '=', creds.login);
    }
    return await generateJwt(validate.is_admin);

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

// LOGIN ROUTE

router.post('/login', async(req, res) => {
    try{
        console.log("login attempted");
        const logCreds = {
        login: req.body.login,
        password: req.body.password
        }
        const jwToken = await userLogin(logCreds);
        res.header('x-auth-token', jwToken).send(200);
    }
    catch (err)
    {
        console.log(err);
    }
});

module.exports = router;