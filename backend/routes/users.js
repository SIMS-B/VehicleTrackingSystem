const express = require("express");
const router = express.Router();

// importing libraries for JWT, password encryption
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// importing app configurations
const appConfig = require('config');

// importing model for this route
const { Users, validatePassword, validateAdmin, validateUser, validatePhoneNumber, validateEmail } = require('../models/users');   
const { Configurations } = require('../models/configurations');

// importing middleware
const auth = require('../middleware/auth');

// importing logger
const logger = require('../startup/logger');

// importing nodemailer transporter
const transporter = require('../startup/nodemailer.js')

//importing twilio for sms
const accountSid = appConfig.get('twilio.TWILIO_ACCOUNT_SID');
const authToken = appConfig.get('twilio.TWILIO_AUTH_TOKEN');
const client = require('twilio')(accountSid, authToken);

// generates JWT
const generateJwt = async (query) => {
    const token = await jwt.sign({is_admin: query.is_admin, id: query.id}, appConfig.get('jwt'));
    
    if (query.is_admin) 
    {
        logger.info("Admin " + query.email + " logged in.");
    }
    else 
    {
        logger.info("User " + query.cnic + " logged in/verified.");
    }
    
    return token;
}

// validation for login and customer verification
const inputValid = async (creds) => {
   
    let check, validateQuery;
    if (!creds.hasOwnProperty('email'))
    {
        // user is logging in
        check = validateUser(creds);
        
        if (check.error!=null)
        {
            // validation error
            return false;
        }
        else 
        {
            // finding cnic in database
            validateQuery = await Users.query().findOne('cnic', '=', creds.cnic);
            
            if (validateQuery == null) 
            {
                // couldn't find record in database
                return false;
            }
        }
    }
    else if (creds.hasOwnProperty('email'))
    {
        // admin is logging in
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
        // checks password against record in database
        return validateQuery;
    }
    else 
    {
        return false;
    }
}

// ROUTES

/**
 * @swagger
 * /api/users:
 *  get:
 *      description: Get account information for customer or admin
 *      tags: [Users]
 *      responses:
 *          200: 
 *              description: Account information for customer or admin has been fetched successfully
 *          400:
 *              $ref: '#/components/responses/BadRequestOrInvalidToken'
 *          401:
 *              $ref: '#/components/responses/noTokenProvided'
 */
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
        logger.error(err); 
        return res.status(400).send('Invalid data received');
    }
});

/**
 * @swagger
 * /api/users/customers:
 *  get:
 *      description: Get Customer(s) List
 *      tags: [Users]
 *      parameters:
 *          - name: cnic
 *            in: query
 *            description: Cnic that needs to be fetched
 *            schema:
 *              type: integer
 *          - name: email
 *            in: query
 *            description: Email that needs to be fetched
 *            schema:
 *              type: string
 *          - name: first_name
 *            in: query
 *            description: First Name that needs to be fetched
 *            schema:
 *              type: string
 *          - name: last_name
 *            in: query
 *            description: Last Name that needs to be fetched
 *            schema:
 *              type: string
 *          - name: registration_date
 *            in: query
 *            description: Registration Date that needs to be fetched
 *            schema:
 *              type: string
 *          - name: is_verified
 *            in: query
 *            description: Verified/Un-Verified that needs to be fetched
 *            schema:
 *              type: boolean
 *      responses:
 *          200: 
 *              description: List of customers has been fetched successfully
 *          204: 
 *              description: There are no customer(s) that match the provided filters
 *          403:
 *              description: Customer is unauthorized to fetch list of customers
 *          400:
 *              $ref: '#/components/responses/BadRequestOrInvalidToken'
 *          401:
 *              $ref: '#/components/responses/noTokenProvided'
 */
router.get('/customers', auth, async(req, res) => {
    try
    {
        const queryParams = req.query;
        const numberOfParameters = Object.keys(queryParams).length;
        if(req.user.is_admin)
        {
            if (numberOfParameters == 0)
            {
                // return all customers if there are no query parameters to filter on
                const allCustomers = await Users.query()
                                                    .select('cnic', 'email', 'first_name', 'last_name', 'registration_date', 'is_verified')
                                                    .where('is_admin', '<>', true)

                return res.status(200).send(allCustomers);
            }
            else
            {
                // filter based on query parameter(s)
                const allCustomers = await Users.query().modify((QueryBuilder) => {
                    Object.keys(queryParams).map((key) => {
                        QueryBuilder
                            .select('cnic', 'email', 'first_name', 'last_name', 'registration_date', 'is_verified')
                            .where(key, queryParams[key]);
                    });

                    QueryBuilder.where('is_admin', '<>' , true);
                });
 
                if (allCustomers.length == 0)
                {
                    // length being 0 means that filter(s) match no result(s)
                    return res.status(204).send('Filter(s) do not match any result');
                }
                else
                {
                    // sucessful filteration with valid results
                    return res.status(200).send(allCustomers);
                }
            }
        }
        else
        {
            // customer is forbidden to view this information
            return res.status(403).send('You cannot access this page');
        }
    }
    catch (err)
    {
        //bad request
        logger.error(err); // remove this console log
        return res.status(400).send('Invalid data received');
    }
});

/**
 * @swagger
 * /api/users:
 *  put:
 *      description: Update email/phone number/password for customer or admin
 *      tags: [Users]
 *      requestBody:
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          oldPassword:
 *                              type: string
 *                          newPassword:
 *                              type: string
 *                          newEmail:
 *                              type: string
 *                          newPhoneNumber:
 *                              type: integer
 *      responses:
 *          200: 
 *              description: Infomation (email/phone number/password) updated successfully
 *          422:
 *              description: Validation check(s) failed against new information (email/phone number/password)
 *          400:
 *              $ref: '#/components/responses/BadRequestOrInvalidToken'
 *          401:
 *              $ref: '#/components/responses/noTokenProvided'
 */
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
                    const hashedPassword = await bcrypt.hash(newPassword, appConfig.get('saltRounds'))

                    // update the old password with new hashed one in db
                    const updatedUser = await Users.query()
                                                        .patch({ password: hashedPassword })
                                                        .where('id', '=', userId);
                    logger.info("Password updated for " + userId)
                    return res.status(200).send(updatedUser);
                }
                else
                {
                    // unprocessable entity as input
                    logger.error(newPassword + " is not a valid password!")
                    return res.status(422).send(`Validation check(s) failed for new password. ${passwordValidationCheck.error.details[0].message}`);
                }
            }
            else
            {
                // unprocessable entity as input
                logger.error(oldPassword + "doesn't match old password")
                return res.status(422).send('Old password is not correct');
            }
        } 
        catch (err)
        {
            // bad request
            logger.error(err);
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
                logger.info("Email updated for " + userId)
                return res.status(200).send(updatedUser);
            }
            else
            {
                // unprocessable entity as input
                logger.error(newEmail + " is not a valid email!")
                return res.status(422).send(`Validation check(s) failed for new email. ${emailValidationCheck.error.details[0].message}`);
            } 
        } 
        catch (err)
        {
            // bad request
            logger.error(err);
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
                logger.info("Phone Number changed for " + userId)
                return res.status(200).send(updatedUser);
            }
            else
            {
                // unprocessable entity as input
                logger.error(newPhoneNumber + " is not a valid phone number!")
                return res.status(422).send(`Validation check(s) failed for new phone number. ${phoneNumberValidationCheck.error.details[0].message}`);
            } 
        } 
        catch (err)
        {
            // bad request
            logger.error(err);
            return res.status(400).send('Invalid data received');
        }
    } 
});

/**
 * @swagger
 * /api/users:
 *  post:
 *      description: Create new customer and his/her associated order OR create new order for existing customer
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          cnic:
 *                              type: integer
 *                          firstName:
 *                              type: string
 *                          lastName:
 *                              type: string
 *                          email:
 *                              type: string
 *                          phoneNumber:
 *                              type: integer
 *                          vehicleName:
 *                              type: string
 *                          vehicleModel:
 *                              type: string
 *                          vehicleColor:
 *                              type: string
 *      responses:
 *          200: 
 *              description: Customer/order created successfully
 *          400:
 *              description: Bad request, invalid data received
 */
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
                const registrationDate = new Date(currDate).toISOString().slice(0, 10).toString(); // YYYY-MM-DD
                const isVerified = false;
                const isAdmin = false;

                // bcrypt password hash
                const hashedPassword = await bcrypt.hash(password, appConfig.get('saltRounds'))

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

                logger.info("New Customer " + cnic + " and Order created.")

                // send email with verification link to the newly created customer
                const verificationMailOptions = {
                    from: appConfig.get('nodeMailer.auth.user'),
                    to: email,
                    subject: 'Account Verification',
                    text: `Please click on this URL to verify your account: _url_` 
                    };

                transporter.sendMail(verificationMailOptions, function(error)
                {
                    if (error) {
                        logger.error(error);
                    } else {
                        logger.info('Email sent to ' + (cnic).toString() + ' with verification link');
                    }
                });

                // send email with new order's tracking ID
                const trackingIdMailOptions = {
                    from: appConfig.get('nodeMailer.auth.user'),
                    to: email,
                    subject: 'Your Tracking ID',
                    text: `Your order's tracking ID is: ${insertQuery.Order[0].id}. Order details are as follows:
                            Car Name: ${vehicleName}
                            Car Model: ${vehicleModel}
                            Car Color: ${vehicleColor}
                            Expected date of delivery of the order is ${deliveryDate}` 
                    };
                
                transporter.sendMail(trackingIdMailOptions, function(error)
                {
                    if (error) {
                        logger.error(error);
                    } else {
                        logger.info('Email sent to ' + (insertQuery.cnic).tostring() + ' with new order tracking ID');
                    }
                });

                // message to be sent after account creation
                const message = "Dear " + firstName + ", \nYour First Time VTS Login Password is: " + password;
                // adding country code prefix to the phone number from database
                const mobileNumber = phoneNumber.toString().replace(phoneNumber, '+92' + phoneNumber)
                
                // send verification message with temporary password to newly created customer
                client.messages
                    .create({
                        body: message,
                        from: '+19567585926',
                        to: mobileNumber
                            })
                    .then(message => logger.info("Verification Message with Password Sent to Customer " + cnic  + " with SMS id " + message.sid))
                    .catch((err) => logger.error(err));


                return res.status(200).send(insertQuery);
            }
            catch (err)
            {
                // bad request
                logger.error(err);  
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

                // const customerId = parseInt(cnicCheck[0].id);
                const userId = parseInt(cnicCheck[0].id);
                
                const insertQuery = await Users.relatedQuery('Order')
                                                .for(userId)
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

                logger.info("New Order Created for User " + cnic)
                
                // send email with new order's tracking ID
                const trackingIdMailOptions = {
                    from: appConfig.get('nodeMailer.auth.user'),
                    to: cnicCheck[0].email,
                    subject: 'Your Tracking ID',
                    text: `Your order's tracking ID is: ${insertQuery.id}. Order details are as follows:
                           Car Name: ${insertQuery.vehicle_name}
                           Car Model: ${insertQuery.vehicle_model}
                           Car Color: ${insertQuery.vehicle_color}
                           Expected date of delivery of the order is ${insertQuery.delivery_date} ` 
                  };
                
                transporter.sendMail(trackingIdMailOptions, function(error)
                {
                    if (error) {
                      logger.error(error);
                    } else {
                      logger.info('Email sent to ' + (insertQuery.cnic).tostring() + ' with new order tracking ID');
                    }
                });
                
                return res.status(200).send(insertQuery);
            }
            catch (err)
            {
                // bad request
                logger.error(err);  
                return res.status(400).send('Invalid data received');
            }
        }
    }
    catch (err)
    {
        // bad request
        logger.error(err);  
        return res.status(400).send('Invalid data received');
    }
});

/**
 * @swagger
 * /api/users/login:
 *  post:
 *      description: Login for customer or admin
 *      tags: [Users]
 *      security: []
 *      requestBody:
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          cnic:
 *                              type: integer
 *                          email:
 *                              type: string
 *                          password:
 *                              required: true
 *                              type: string
 *      responses:
 *          200: 
 *              description: User logged in successfully
 *          422:
 *              description: Validation check(s) failed against the provided login credentials
 *          400:
 *              description: Bad request, invalid data received
 *          401:
 *              description: User has not been verified
 */
router.post('/login', async(req, res) => {
    try
    {
        const logCreds = req.body;
        const result = await inputValid(logCreds);

        // adding country prefix to the phone number from database
        const phoneNumber = result.phone_number.replace(result.phone_number, '+92' + result.phone_number)
        const message = "Your First TIme VTS Login Password is: " + req.body.password
        //
        client.messages
        .create({
            body: message,
            from: '+19567585926',
            to: phoneNumber
                })
        .then(message => logger.info("Verification Message with Password Sent to: " + " with SMS id " + message.sid));


        if (!result)
        {
            // unprocessable entity as input
            logger.error("Validation Unsuccessful!")
            return res.status(422).send('Validation check(s) failed');
                
        }
        if (!result.is_verified)
        {
            // unauthorized to login without verification
            logger.error("User not verified!")
            return res.status(401).send('Login failed due to non-verification')
        }
        
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
        logger.error(err);  
        return res.status(400).send('Invalid data received');
    }
});

/**
 * @swagger
 * /api/users/verify:
 *  post:
 *      description: Customer verification
 *      tags: [Users]
 *      security: []
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          cnic:
 *                              type: integer
 *                          password:
 *                              type: string
 *      responses:
 *          200: 
 *              description: Customer has been verified
 *          422:
 *              description: Validation check(s) failed against the provided credentials
 *          400:
 *              description: Bad request, invalid data received
 *          409:
 *              description: Customer already verified
 */
router.post('/verify', async(req, res) => {
    try
    {
        const creds = req.body;
        const validation = await inputValid(creds);
        if (!validation) 
        {
            // unprocessable entity as input
            logger.error("Validation Unsuccessful!")
            return res.status(422).send('Validation check(s) failed');
        }
        else 
        {
            if (validation.is_verified) 
            {
                // conflict of request with current state of database
                logger.error("User " + validation.cnic + " is already Verified!")
                res.status(409).send('Customer already verified');
            }
            else 
            {
                // verify user in db
                logger.info("User " + validation.cnic + " has been verified!")
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
        logger.error(err);  
        return res.status(400).send('Invalid data received');
    }
});

module.exports = router;