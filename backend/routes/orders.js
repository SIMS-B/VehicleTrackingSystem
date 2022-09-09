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
                const allOrders = await Orders.query().modify((QueryBuilder) => {
                    Object.keys(queryParams).map((key) => {
                        QueryBuilder.where(key, queryParams[key]);
                    });
                    QueryBuilder.where('id','=',userId);
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
        }  
    } 
    catch (err)
    {
        console.log(err);   // remove this console log
        return res.status(400).send('Some error occured');
    }
});

module.exports = router;