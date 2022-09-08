const express = require("express");
const jwt = require("jsonwebtoken");
const Joi = require('joi');
const { knex, query } = require("../models/users");
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