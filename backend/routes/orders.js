const express = require('express');
const router = express.Router();
const logger = require("../logger");

const { Orders } = require('../models/orders');   // importing model for this route

// importing middleware
const auth = require('../middleware/auth');

// importing libraries
const knex = require('knex');
const { route } = require('./users');
const { Logger } = require('winston');

// ROUTES

router.get('/', auth, async (req, res) => {
    try
    {
        const isAdmin = req.user.is_admin;
        const userId = parseInt(req.user.id);
        const queryParams = req.query;
        const numberOfParameters = Object.keys(queryParams).length;

        
        if (numberOfParameters == 0)
        {
            // return all the orders if there are no query paramters to filter on
            
            if (isAdmin)
            {
                // return all orders for admin
                const allOrders = await Orders.query();

                return res.status(200).send(allOrders);
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

                return res.status(200).send(allOrdersOfCustomer);
            }
        }
        else
        {
            // filter based on query parameter(s)
            if (isAdmin)
            {
                // return all orders for admin filtered on provided filters
                const allOrders = await Orders.query().modify((QueryBuilder) => {
                    Object.keys(queryParams).map((key) => {
                        QueryBuilder.where(key, queryParams[key]);
                    });
                });
 
                if (allOrders.length == 0)
                {
                    // length being 0 means that filter(s) match no result(s)
                    return res.status(204).send('Filter(s) do not match any result');
                }
                else
                {
                    // sucessful filteration with valid results
                    return res.status(200).send(allOrders);
                }
            }
            else
            {
                // return all orders of the customer filtered on provided filters
                const allOrdersOfCustomer = await Orders.query().modify((QueryBuilder) => {
                    Object.keys(queryParams).map((key) => {
                        QueryBuilder.where(key, queryParams[key]);
                    });
                    
                    QueryBuilder.where('user_id','=',userId);
                });

                if (allOrdersOfCustomer.length == 0)
                {
                    // length being 0 means that filter(s) match no result(s)
                    return res.status(204).send('Filter(s) do not match any result');
                }
                else
                {
                    // sucessful filteration with valid results. Add ETA to each order

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

                    return res.status(200).send(allOrdersOfCustomer);
                }
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

router.get('/status', auth, async(req, res) => {
    try
    {
        let showOrders=[];
        const isAdmin = req.user.is_admin;
        
        if (isAdmin)
        {
            // admin can be notified if orders need status change
            const allOrders = await Orders.query();
            
            allOrders.map(async(key) => {
                const configArray = Object.values(key.config);
                const sumOfConfigs = configArray.reduce((a,b)=>a+b, 0);
                const endingDate = Date.parse(key.delivery_date);
                const startingDate = Date.parse(key.starting_date);
                const totalDays = endingDate - startingDate;
                const currentDays = Date.now() - startingDate;

                if (key.status == 'po_reception') {
                    // condition checks current status of order to see if status needs to be changed
                    const days = (configArray[0]/sumOfConfigs)*totalDays
                    if (currentDays >= days) showOrders.push(key);
                }
                else if (key.status == 'factory_floor') {
                    const days = (configArray[1]/sumOfConfigs)*totalDays
                    if (currentDays >= days) showOrders.push(key);
                }
                else if (key.status == 'vin') {
                    const days = (configArray[2]/sumOfConfigs)*totalDays
                    if (currentDays >= days) showOrders.push(key);
                }
                else if (key.status == 'chassis') {
                    const days = (configArray[3]/sumOfConfigs)*totalDays
                    if (currentDays >= days) showOrders.push(key);
                }
                else if (key.status == 'ready_to_ship') {
                    const days = (configArray[4]/sumOfConfigs)*totalDays
                    if (currentDays >= days) showOrders.push(key);
                }
                else if (key.status == 'arrived_at_vendor') {
                    const days = (configArray[5]/sumOfConfigs)*totalDays
                    if (currentDays >= days) showOrders.push(key);
                }
            })

            return res.status(200).send(showOrders);
        }
        else 
        {
            // customer is forbidden to view this information
            return res.status(403).send('You cannot access this page');
        } 
    }
    catch (err)
    {
        // bad request
        logger.error(err);  
        return res.status(400).send('Invalid data received');
    }  
});

router.put('/', auth, async(req, res) => {
    try
    {
        const isAdmin = req.user.is_admin;
        
        if (isAdmin)
        {
            // admin can change delivery date of order
            const orderList = req.body.array;
            const startingDate = Date.parse(req.body.start_date);
            const newDate = req.body.new_date
            const newEndingDate = Date.parse(newDate);
            
            if (orderList.length === 0) 
            {
                // condition checks if any orders are filtered
                return res.status(204).send('No order(s) selected');
            }
            else
            {
                if (!newDate) 
                {
                    // unprocessable entity as input
                    logger.error("New Delivery Date not provided.")
                    return res.status(422).send('New delivery date not provided');
                }
                else
                {
                    if(newEndingDate > startingDate)
                    {
                        // condition checks if delivery date is valid
                        const updatedOrders = orderList.map(async(key) => {
                            await Orders.query().patch({delivery_date: newDate}).where('id', '=', key.id)
                        });
                        logger.info("Delivery Date Updated to " + newDate + " for filtered orders.")
                        return res.status(200).send(updatedOrders);
                    }
                    else
                    {
                        // unprocessable entity as input
                        logger.error("New Delivery Date Cannot Be Earlier than Old Delivery Date")
                        return res.status(422).send('Ending date cannot be smaller than starting date');
                    }
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
        // bad request
        logger.error(err);   
        return res.status(400).send('Invalid data received');
    }
});

router.put('/status', auth, (req, res) => {
    try
    {
        const isAdmin = req.user.is_admin;
        
        if (isAdmin)
        {
            // admin can change the status of orders
            const orderList = req.body.array;
            const currentStatus = req.body.current_status;
            const newStatus = req.body.new_status;
            
            if (orderList.length === 0) 
            {
                // condition checks if any orders are filtered
                return res.status(204).send('No order(s) selected');
            }
            else
            {
                if (!newStatus) 
                {
                    // unprocessable entity as input
                    logger.error("New Status Not Provided!")
                    return res.status(422).send('New status not provided');
                }
                else
                {
                    if(newStatus != currentStatus)
                    {
                        // condition checks if new status is the same as current status or not
                        const updatedOrders = orderList.map(async(key) => {
                            await Orders.query().patch({status: newStatus}).where('id', '=', key.id)
                        });
                        logger.info("Order Status Updated to " + newStatus + " for filtered orders." )
                        return res.status(200).send(updatedOrders);
                    }
                    else
                    {
                        // unprocessable entity as input
                        logger.error("New Status cannot be same as current status!")
                        return res.status(422).send('New status cannot be same as current status');
                    }
                }
            }            
        }
        else
        {
            // customer is forbidden to view this information
            return res.status(403).send('You cannot access this page');
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