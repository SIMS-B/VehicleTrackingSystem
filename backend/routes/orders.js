const express = require('express');
const router = express.Router();

const { Orders } = require('../models/orders');   // importing model for this route

// importing middleware
const auth = require('../middleware/auth');

// importing libraries
const knex = require('knex');

// ROUTES

router.get('/', auth, async (req, res) => {

    try
    {
        const isAdmin = req.user.is_admin;
        const userId = parseInt(req.user.id);
        const queryParams = req.query;
        const numberOfParameters = Object.keys(queryParams).length;

        // return all the orders if there are no query paramters to filter on
        if (numberOfParameters == 0)
        {
            // return all orders for admin
            if (isAdmin)
            {
                const allOrders = await Orders.query();

                return res.status(200).send(`All orders fetched ${JSON.stringify(allOrders)}`);
            }
            else
            {
                // return all orders of customer by filtering on ID

                const allOrdersOfCustomer = await Orders.query()
                                                            .where('id', '=', userId);

                return res.status(200).send(`All customer's orders fetched ${JSON.stringify(allOrdersOfCustomer)}`);
            }
        }
        else
        {
            // filter based on query parameter to filter on

            // return all orders for admin filtered on provided filters
            if (isAdmin)
            {
                const orderIdCondition = queryParams.hasOwnProperty('orderID') ? ['id', '=', queryParams.orderID.toString()] : [1, '=', 1]; 
                const cnicCondition = queryParams.hasOwnProperty('cnic') ? ['cnic', '=', queryParams.cnic.toString()] : [1, '=', 1]; 
                const vehicleNameCondition = queryParams.hasOwnProperty('vehicleName') ? ['vehicle_name', '=', queryParams.vehicleName.toString()] : [1, '=', 1]; 
                const vehicleModelCondition = queryParams.hasOwnProperty('vehicleModel') ? ['vehicle_model', '=', queryParams.vehicleModel.toString()] : [1, '=', 1]; 
                const vehicleColorCondition = queryParams.hasOwnProperty('vehicleColor') ? ['vehicle_color', '=', queryParams.vehicleColor.toString()] : [1, '=', 1]; 
                const statusCondition = queryParams.hasOwnProperty('status') ? ['status', '=', queryParams.status.toString()] : [1, '=', 1]; 
                const startingDateCondition = queryParams.hasOwnProperty('startingDate') ? ['starting_date', '=', queryParams.startingDate.toString()] : [1, '=', 1]; 
                const endingDateCondition = queryParams.hasOwnProperty('endingDate') ? ['ending_date', '=', queryParams.endingDate.toString()] : [1, '=', 1];
                const userIdCondition = queryParams.hasOwnProperty('userID') ? ['user_id', '=', queryParams.userID.toString()] : [1, '=', 1]; 

                const allOrders = await Orders.query()
                                                    .where(orderIdCondition[0], orderIdCondition[1], orderIdCondition[2])
                                                    .where(cnicCondition[0], cnicCondition[1], cnicCondition[2])
                                                    .where(vehicleNameCondition[0], vehicleNameCondition[1], vehicleNameCondition[2])
                                                    .where(vehicleModelCondition[0], vehicleModelCondition[1], vehicleModelCondition[2])
                                                    .where(vehicleColorCondition[0], vehicleColorCondition[1], vehicleColorCondition[2])
                                                    .where(statusCondition[0], statusCondition[1], statusCondition[2])
                                                    .where(startingDateCondition[0], startingDateCondition[1], startingDateCondition[2])
                                                    .where(endingDateCondition[0], endingDateCondition[1], endingDateCondition[2])
                                                    .where(userIdCondition[0], userIdCondition[1], userIdCondition[2]);

                // if empty then filter matches no result(s)
                if (allOrders.length == 0)
                {
                    return res.status(204).send('Filter(s) do not match any result');
                }
                else
                {
                    // otherwise return results
                    return res.status(200).send(`All orders fetched ${JSON.stringify(allOrders)}`);
                }
            }
            else
            {
                // return all orders of customer by filtering on ID and all the provided filters
                const orderIdCondition = queryParams.hasOwnProperty('orderID') ? ['id', '=', queryParams.orderID.toString()] : [1, '=', 1]; 
                const cnicCondition = queryParams.hasOwnProperty('cnic') ? ['cnic', '=', queryParams.cnic.toString()] : [1, '=', 1]; 
                const vehicleNameCondition = queryParams.hasOwnProperty('vehicleName') ? ['vehicle_name', '=', queryParams.vehicleName.toString()] : [1, '=', 1]; 
                const vehicleModelCondition = queryParams.hasOwnProperty('vehicleModel') ? ['vehicle_model', '=', queryParams.vehicleModel.toString()] : [1, '=', 1]; 
                const vehicleColorCondition = queryParams.hasOwnProperty('vehicleColor') ? ['vehicle_color', '=', queryParams.vehicleColor.toString()] : [1, '=', 1]; 
                const statusCondition = queryParams.hasOwnProperty('status') ? ['status', '=', queryParams.status.toString()] : [1, '=', 1]; 
                const startingDateCondition = queryParams.hasOwnProperty('startingDate') ? ['starting_date', '=', queryParams.startingDate.toString()] : [1, '=', 1]; 
                const endingDateCondition = queryParams.hasOwnProperty('endingDate') ? ['ending_date', '=', queryParams.endingDate.toString()] : [1, '=', 1];

                const allOrders = await Orders.query()
                                                    .where(orderIdCondition[0], orderIdCondition[1], orderIdCondition[2])
                                                    .where(cnicCondition[0], cnicCondition[1], cnicCondition[2])
                                                    .where(vehicleNameCondition[0], vehicleNameCondition[1], vehicleNameCondition[2])
                                                    .where(vehicleModelCondition[0], vehicleModelCondition[1], vehicleModelCondition[2])
                                                    .where(vehicleColorCondition[0], vehicleColorCondition[1], vehicleColorCondition[2])
                                                    .where(statusCondition[0], statusCondition[1], statusCondition[2])
                                                    .where(startingDateCondition[0], startingDateCondition[1], startingDateCondition[2])
                                                    .where(endingDateCondition[0], endingDateCondition[1], endingDateCondition[2])
                                                    .where('id', '=', userId);

                // if empty then filter matches no result(s)
                if (allOrders.length == 0)
                {
                    return res.status(204).send('Filter(s) do not match any result');
                }
                else
                {
                    // otherwise return results
                    return res.status(200).send(`All orders fetched ${JSON.stringify(allOrders)}`);
                }
            }
        }  
    } 
    catch (err)
    {
        console.log(err);   // remove this console log
        return res.status(400).send('Some error occured');
    }
});

router.get('/status', auth, async(req, res) => {
    try
    {
        let showOrders=[];
        const isAdmin = req.user.is_admin;
    if(isAdmin)
    {
        const allOrders = await Orders.query();
        allOrders.map(async(key) => {
            const configArray = Object.values(key.config);
            const sumOfConfigs = configArray.reduce((a,b)=>a+b, 0);
            const endingDate = Date.parse(key.delivery_date);
            const startingDate = Date.parse(key.starting_date);
            const totalDays = endingDate - startingDate;
            const currentDays = Date.now() - startingDate;

            //if structure

            if(key.status == 'po_reception') {
                const days = (configArray[0]/sumOfConfigs)*totalDays
                if(currentDays >= days) showOrders.push(key);
            }
            else if(key.status == 'factory_floor') {
                const days = (configArray[1]/sumOfConfigs)*totalDays
                if(currentDays >= days) showOrders.push(key);
            }
            else if(key.status == 'vin') {
                const days = (configArray[2]/sumOfConfigs)*totalDays
                if(currentDays >= days) showOrders.push(key);
            }
            else if(key.status == 'chassis') {
                const days = (configArray[3]/sumOfConfigs)*totalDays
                if(currentDays >= days) showOrders.push(key);
            }
            else if(key.status == 'ready_to_ship') {
                const days = (configArray[4]/sumOfConfigs)*totalDays
                if(currentDays >= days) showOrders.push(key);
            }
            else if(key.status == 'arrived_at_vendor') {
                const days = (configArray[5]/sumOfConfigs)*totalDays
                if(currentDays >= days) showOrders.push(key);
            }
        })
        return res.status(200).send(showOrders);
    }
    else return res.status(403).send("You cannot access this page!");   
    }
    catch(err)
    {
        console.log(err);
    }
});

module.exports = router;