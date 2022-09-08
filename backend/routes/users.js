const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// importing model for this route
const { Users, validatePassword, validateAdmin, validateUser } = require('../models/users');  
const { Configurations } = require('../models/configurations');  

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
   
    let check, validateQuery;
    if(creds.email == undefined)
    {
        check = validateUser(creds);
        if(check.error!=null){
            return false;
        } 
        else {
            validateQuery = await Users.query().findOne('cnic', '=', creds.cnic);
            if(validateQuery == null) return false;
        }
    }
    else if(creds.email != undefined)
    {
        check = validateAdmin(creds);
        if(check.error!=null) {
            return false;
        }
        else {
            validateQuery = await Users.query().findOne('email', '=', creds.email); 
            if(validateQuery == null) return false;
        }} 
    return dbValid(creds, validateQuery);
    }

// validation from database

const dbValid = (creds, validateQuery) => {
        if(creds.password == validateQuery.password){
           return validateQuery;
        }
        else return false;

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

router.post('/', auth, async (req, res) => {

    // fetch all configurations
    const configurationQuery = await Configurations.query();
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
            const currDate = new Date();
            const offsetDate = currDate.setDate(currDate.getDate() + configurationSum);
            const firstName = req.body.firstName.toString();
            const lastName = req.body.lastName.toString();
            const email = req.body.email.toString();    // validate email
            const phoneNumber = parseInt(req.body.phoneNumber);    // validate phone number
            const password = Math.random().toString(36).slice(2, 10).toString();
            const registrationDate = new Date(currDate).toISOString().slice(0, 10).toString(); // YYYY-MM-DD
            const isVerified = false;
            const isAdmin = false;

            const vehicleName = req.body.vehicleName.toString();
            const vehicleModel = req.body.vehicleModel.toString();
            const vehicleColor = req.body.vehicleColor.toString();
            const status = 'po_reception'; // all new orders are set at po_reception stage
            const startingDate = registrationDate;
            const deliveryDate = new Date(offsetDate).toISOString().slice(0, 10).toString(); // YYYY-MM-DD


            const insertQuery = await Users.query().insertGraph(
            {
                cnic: cnic,
                first_name: firstName,
                last_name: lastName, 
                email: email,
                phone_number: phoneNumber,
                password: password,
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
                    delivery_date: deliveryDate
                }]
            })
        
            return res.status(200).send('New customer and their order created successfully');
        }
        catch (err)
        {
            console.log(err);   // remove this print
            return res.status(400).send('Some error occured');
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
        
            const currDate = new Date();
            const offsetDate = currDate.setDate(currDate.getDate() + configurationSum);
            const startingDate = new Date(currDate).toISOString().slice(0, 10).toString(); // YYYY-MM-DD
            const deliveryDate = new Date(offsetDate).toISOString().slice(0, 10).toString(); // YYYY-MM-DD

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
                                                user_id: userId
                                            })

            return res.status(200).send('New order for existing customer created successfully');
        }
        catch (err)
        {
            console.log(err);   // remove this print
            return res.status(400).send('Some error occured');
        }
    }
});

router.post('/login', async(req, res) => {
    try{
        const logCreds = req.body;
        const result = await inputValid(logCreds);
        if(!result){
            return res.status(400).send("Invalid Input");
        }
        console.log("result :", result)
        token = await generateJwt(result)
        if(!token) return res.send(400);
        else return res.status(200).send(token);
        
    }
    catch (err)
    {
        console.log(err);
    }
});



module.exports = router;