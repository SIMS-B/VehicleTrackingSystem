const jwt = require("jsonwebtoken");

// importing app configurations
const config = require('config');

module.exports = function(req, res, next) {

    const token = req.header("x-auth-token");
    if (!token) return res.status(401).send("Access denied. User failed to provide a web token for authorization");

    try 
    {
        const decoded = jwt.verify(token, config.get('jwt'));
        req.user = decoded;
        next();
    } 
    catch (ex) 
    {
        res.status(400).send("Invalid token. User failed to provide a valid web token");
    }
};