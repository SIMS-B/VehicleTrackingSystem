const express = require('express');
const router = express.Router();

const { Orders } = require('../models/orders');   // importing model for this route

// importing middleware
const auth = require('../middleware/auth');

// importing libraries
const knex = require('knex');
const { route } = require('./users');

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
                                                            .where('user_id', '=', userId);

                // calculate ETA of each order
                allOrdersOfCustomer.map((order) => {

                    const startingDate = order.starting_date;
                    const deliveryDate = order.delivery_date;

                    const secStartingDate = Date.parse(startingDate);
                    const secDeliveryDate = Date.parse(deliveryDate);
                    const secDifference = parseInt(secDeliveryDate) - parseInt(secStartingDate);
                    const dayDifference = Math.floor(secDifference / 86400000);

                    order.eta = dayDifference;
                });

                return res.status(200).send(`All customer's orders fetched ${JSON.stringify(allOrdersOfCustomer)}`);
            }
        }
        else
        {
            // filter based on query parameter to filter on

            // return all orders for admin filtered on provided filters
            if (isAdmin)
            {
                const allOrders = await Orders.query().modify((QueryBuilder) => {
                    Object.keys(queryParams).map((key) => {
                        QueryBuilder.where(key, queryParams[key]);
                    });
                });

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
                const allOrdersOfCustomer = await Orders.query().modify((QueryBuilder) => {
                    Object.keys(queryParams).map((key) => {
                        QueryBuilder.where(key, queryParams[key]);
                    });
                    QueryBuilder.where('user_id','=',userId);
                });

                // if empty then filter matches no result(s)
                if (allOrdersOfCustomer.length == 0)
                {
                    return res.status(204).send('Filter(s) do not match any result');
                }
                else
                {
                    // otherwise return results after adding their ETAs

                    // calculate ETA of each order
                    allOrdersOfCustomer.map((order) => {

                        const startingDate = order.starting_date;
                        const deliveryDate = order.delivery_date;

                        const secStartingDate = Date.parse(startingDate);
                        const secDeliveryDate = Date.parse(deliveryDate);
                        const secDifference = parseInt(secDeliveryDate) - parseInt(secStartingDate);
                        const dayDifference = Math.floor(secDifference / 86400000);

                        order.eta = dayDifference;
                    });

                    return res.status(200).send(`All orders fetched ${JSON.stringify(allOrdersOfCustomer)}`);
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

//Show order notification for status change
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


 // Update Delivery Date
router.put('/', auth, async(req, res) => {
    try
    {
        const isAdmin = req.user.is_admin;
        if(isAdmin)
        {
            const orderList = req.body.array;
            const startingDate = Date.parse(req.body.start_date);
            const newDate = req.body.new_date
            const newEndingDate = Date.parse(newDate);
            if(orderList.length === 0) res.status(400).send("No orders selected!");
            else
            {
                if(!newDate) res.status(400).send("No date given!");
                else
                {
                    if(newEndingDate > startingDate)
                    {
                        const updatedOrders = orderList.map(async(key) => {
                            console.log(key);
                            await Orders.query().patch({delivery_date: newDate}).where('id', '=', key.id)
                        });
                    
                        res.status(200).send("Successfully Updated Delivery Date!");
                    }
                    else
                    {
                        res.status(400).send("Enter a Valid Ending Date!");
                    }
                }
            }
        }
        else
        {
            res.status(403).send("You cannot access this page.")
        }
    }
    catch (err)
    {
        console.log(err);

    }
});

// update status of ongoing orders
router.put('/status', auth, (req, res) => {
    try{
        const isAdmin = req.user.is_admin;
        if(isAdmin)
        {
            const orderList = req.body.array;
            const currentStatus = req.body.current_status
            const newStatus = req.body.new_status;
            if(orderList.length === 0) res.status(400).send("No orders selected!");
            else
            {
                if(!newStatus) res.status(400).send("No status given!");
                else
                {
                    const updatedOrders = orderList.map(async(key) => {
                        console.log(key);
                        await Orders.query().patch({status: newStatus}).where('id', '=', key.id)
                    });
                    res.status(200).send("Successfully Updated Status!");
                }
            }            
        }
        else
        {

            res.status(403).send("You cannot access this page.");
        }
    }
    catch(err)
    {
        console.log(err);
    }
});

module.exports = router;