const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// importing app configurations
const config = require('config');

// importing model for this route
const { Users, validatePassword, validateAdmin, validateUser, validatePhoneNumber, validateEmail } = require('../models/users');   
const { Configurations } = require('../models/configurations');

// importing middleware
const auth = require('../middleware/auth');

// generates JWT
const generateJwt = async (query) => {
    const token = await jwt.sign({is_admin: query.is_admin, id: query.id}, config.get('jwt'));
    
    if (query.is_admin) 
    {
        console.log("Admin logged in.");
    }
    else 
    {
        console.log("User logged/verified in.");
    }
    
    return token;
}

// validation for login and customer verification
const inputValid = async (creds) => {
   
    let check, validateQuery;

    if (creds.email == undefined)
    {
        check = validateUser(creds);
        
        if (check.error!=null)
        {
            return false;
        }
        else 
        {
            validateQuery = await Users.query().findOne('cnic', '=', creds.cnic);
            
            if (validateQuery == null) 
            {
                return false;
            }
        }
    }
    else if (creds.email != undefined)
    {
        check = validateAdmin(creds);
        
        if (check.error != null) 
        {
            return false;
        }
        else 
        {
            validateQuery = await Users.query().findOne('email', '=', creds.email); 
            
            if (validateQuery == null) 
            {
                return false;
            }
        }} 
    
    if (await bcrypt.compare(creds.password, validateQuery.password))
    {
        return validateQuery;
    }
    else 
    {
        return false;
    }
}

// ROUTES

router.get('/', auth, async (req, res) => {
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
        // bad request
        console.log(err);   // remove this console log
        return res.status(400).send('Invalid data received');
    }
});

router.put('/', auth, async (req, res) => {
    
    const userId = parseInt(req.user.id);

    // flags to check which property to update
    const oldPasswordCheck = req.body.hasOwnProperty('oldPassword');
    const newPasswordCheck = req.body.hasOwnProperty('newPassword');
    const newEmailCheck = req.body.hasOwnProperty('newEmail');
    const newPhoneNumberCheck = req.body.hasOwnProperty('newPhoneNumber');

    if (oldPasswordCheck && newPasswordCheck)
    {
        // change password only and return
        try
        {
            const oldPassword = req.body.oldPassword.toString();
            const newPassword = req.body.newPassword.toString();

            // check if oldPassword is same as in db
            const oldPasswordInDb = await Users.query()
                                                .select('password')
                                                .where('id', '=', userId);

            const oldPasswordToCompare = oldPasswordInDb.toString();
            
            if (await bcrypt.compare(oldPassword, oldPasswordToCompare))
            {
                // validate new password against password validation checks
                const passwordValidationCheck = validatePassword( {pwd: newPassword} ); 

                if (passwordValidationCheck.error == null)
                {
                    // hashing new password
                    const hashedPassword = await bcrypt.hash(newPassword, config.get('saltRounds'))

                    // update the old password with new hashed one in db
                    const updatedUser = await Users.query()
                                                        .patch({ password: hashedPassword })
                                                        .where('id', '=', userId);

                    return res.status(200).send(updatedUser);
                }
                else
                {
                    // unprocessable entity as input
                    return res.status(422).send(`Validation check(s) failed for new password. ${passwordValidationCheck.error.details[0].message}`);
                }
            }
            else
            {
                // unprocessable entity as input
                return res.status(422).send('Old password is not correct');
            }
        } 
        catch (err)
        {
            // bad request
            console.log(err);   // remove this console log
            return res.status(400).send('Invalid data received');
        }
    }

    if (newEmailCheck)
    {
        // change email only and return
        try
        {
            const newEmail = req.body.newEmail.toString();

            // verify if this is a valid email address or not
            const emailValidationCheck = validateEmail( {newEmail: newEmail} ); 

            if (emailValidationCheck.error == null)
            {
                // update the email
                const updatedUser = await Users.query()
                                                .patch({ email: newEmail })
                                                .where('id', '=', userId);

                return res.status(200).send(updatedUser);
            }
            else
            {
                // unprocessable entity as input
                return res.status(422).send(`Validation check(s) failed for new email. ${emailValidationCheck.error.details[0].message}`);
            } 
        } 
        catch (err)
        {
            // bad request
            console.log(err);   // remove this console log
            return res.status(400).send('Invalid data received');
        }
    }

    if (newPhoneNumberCheck)
    {
        // change phone_number only and return
        try
        {
            const newPhoneNumber = parseInt(req.body.newPhoneNumber);

            // verify if this is a valid email address or not
            const phoneNumberValidationCheck = validatePhoneNumber( {newPhoneNumber: newPhoneNumber} ); 

            if (phoneNumberValidationCheck.error == null)
            {
                // update the email
                const updatedUser = await Users.query()
                                                    .patch({ phone_number: newPhoneNumber })
                                                    .where('id', '=', userId);

                return res.status(200).send(updatedUser);
            }
            else
            {
                // unprocessable entity as input
                return res.status(422).send(`Validation check(s) failed for new phone number. ${phoneNumberValidationCheck.error.details[0].message}`);
            } 
        } 
        catch (err)
        {
            // bad request
            console.log(err);   // remove this console log
            return res.status(400).send('Invalid data received');
        }
    } 
});

router.post('/', auth, async (req, res) => {
    try 
    {
        // fetch all configurations
        const configurationQuery = await Configurations.query()
                                                        .select('po_reception', 'factory_floor', 'vin', 'chassis', 'ready_to_ship', 'arrival_at_vendor');

        const configurationSum = parseInt(configurationQuery[0].po_reception) + parseInt(configurationQuery[0].factory_floor) + parseInt(configurationQuery[0].vin) + parseInt(configurationQuery[0].chassis) + parseInt(configurationQuery[0].ready_to_ship) + parseInt(configurationQuery[0].arrival_at_vendor);

        // check if user with cnic exists or not
        const cnic = parseInt(req.body.cnic);
        const cnicCheck = await Users.query()
                                        .select('id', 'cnic', 'first_name', 'last_name', 'email', 'phone_number')
                                        .where('cnic', '=', cnic);

        if (cnicCheck.length == 0)
        {
            // customer does not exist, create new customer and order
            try
            {
                const currDate = Date.now();
                const firstName = req.body.firstName.toString();
                const lastName = req.body.lastName.toString();
                const email = req.body.email.toString();    // validate email
                const phoneNumber = parseInt(req.body.phoneNumber);    // validate phone number
                const password = Math.random().toString(36).slice(2, 10).toString();
                
                console.log("Random Password: ", password)
                
                const registrationDate = new Date(currDate).toISOString().slice(0, 10).toString(); // YYYY-MM-DD
                const isVerified = false;
                const isAdmin = false;

                // bcrypt password hash
                const hashedPassword = await bcrypt.hash(password, config.get('saltRounds'))

                const vehicleName = req.body.vehicleName.toString();
                const vehicleModel = req.body.vehicleModel.toString();
                const vehicleColor = req.body.vehicleColor.toString();
                const status = 'po_reception'; // all new orders are set at po_reception stage
                const startingDate = registrationDate;
                const configInMillisec = configurationSum * 86400000;
                const offsetDateInMillisec = currDate + configInMillisec;
                const deliveryDate = new Date(offsetDateInMillisec).toISOString().slice(0, 10).toString(); // YYYY-MM-DD
                const config = configurationQuery[0];

                const insertQuery = await Users.query().insertGraph(
                {
                    cnic: cnic,
                    first_name: firstName,
                    last_name: lastName, 
                    email: email,
                    phone_number: phoneNumber,
                    password: hashedPassword,
                    registration_date: registrationDate,
                    is_verified: isVerified,
                    is_admin: isAdmin,
                    
                    Order: [{
                        cnic: cnic,
                        vehicle_name: vehicleName,
                        vehicle_model: vehicleModel,
                        vehicle_color: vehicleColor,
                        status: status,
                        starting_date: startingDate,
                        delivery_date: deliveryDate,
                        config: config
                    }]
                })
            
                return res.status(200).send(insertQuery);
            }
            catch (err)
            {
                // bad request
                console.log(err);   // remove this console log
                return res.status(400).send('Invalid data received');
            }
        }
        else
        {
            // customer exists, create only a new order associated to them
            try
            {
                const vehicleName = req.body.vehicleName.toString();
                const vehicleModel = req.body.vehicleModel.toString();
                const vehicleColor = req.body.vehicleColor.toString();
                const status = 'po_reception'; // all new orders are set at po_reception stage
            
                const currDate = Date.now();
                const startingDate = new Date(currDate).toISOString().slice(0, 10).toString();
                const configInMillisec = configurationSum * 86400000;
                const offsetDateInMillisec = currDate + configInMillisec;
                const deliveryDate = new Date(offsetDateInMillisec).toISOString().slice(0, 10).toString(); // YYYY-MM-DD
                const config = configurationQuery[0];

                const customerId = parseInt(cnicCheck[0].id);
                const userId = parseInt(cnicCheck[0].id);
                
                const insertQuery = await Users.relatedQuery('Order')
                                                .for(customerId)
                                                .insert({
                                                    cnic: cnic,
                                                    vehicle_name: vehicleName,
                                                    vehicle_model: vehicleModel,
                                                    vehicle_color: vehicleColor,
                                                    status: status,
                                                    starting_date: startingDate,
                                                    delivery_date: deliveryDate,
                                                    user_id: userId,
                                                    config: config
                                                })

                return res.status(200).send(insertQuery);
            }
            catch (err)
            {
                // bad request
                console.log(err);   // remove this console log
                return res.status(400).send('Invalid data received');
            }
        }
    }
    catch (err)
    {
        // bad request
        console.log(err);   // remove this console log
        return res.status(400).send('Invalid data received');
    }
});

router.post('/login', async(req, res) => {
    try
    {
        const logCreds = req.body;
        
        const result = await inputValid(logCreds);
        
        if (!result)
        {
            // unprocessable entity as input
            return res.status(422).send('Validation check(s) failed');
                
        }
        if (!result.is_verified)
        {
            // unauthorized to login without verification
            return res.status(401).send('Login failed due to non-verification')
        }
        
        console.log("result :", result)
        
        token = await generateJwt(result);
        if (!token) 
        { 
            return res.status(400).send('Invalid data received');
        }
        else 
        {
            return res.status(200).send(token);
        }
    }
    catch (err)
    {
        // bad request
        console.log(err);   // remove this console log
        return res.status(400).send('Invalid data received');
    }
});

router.post('/verify', async(req, res) => {
    try
    {
        const creds = req.body;
        const validation = await inputValid(creds);
        
        if (!validation) 
        {
            // unprocessable entity as input
            return res.status(422).send('Validation check(s) failed');
        }
        else 
        {
            if (validation.is_verified) 
            {
                // conflict of request with current state of database
                res.status(409).send('Customer already verified');
            }
            else 
            {
                const verifyUser = await Users.query().patch({is_verified: true}).where('id', '=', validation.id);
                
                // generate jwt for redirection to change password from front-end
                token = await generateJwt(result);
                if (!token) 
                {
                    return res.status(400).send('Invalid data received');
                }
                else 
                {
                    return res.status(200).send(token);
                }
            }
        }
    }
    catch(err)
    {
        // bad request
        console.log(err);   // remove this console log
        return res.status(400).send('Invalid data received');
    }
});

module.exports = router;