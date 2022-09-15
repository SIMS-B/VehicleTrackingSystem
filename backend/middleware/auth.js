const jwt = require("jsonwebtoken");

// importing app configurations
const appConfig = require('config');

module.exports = function(req, res, next) {

    let token = req.header("Authorization")

    if (!token) return res.status(401).send("Access denied. User failed to provide a web token for authorization");

    // extract token if token is from swagger 
    const splitResult = token.split(' ');
    if (splitResult.length == 2)
    {
        token = splitResult[1];
    }
    
    try 
    {
        const decoded = jwt.verify(token, appConfig.get('jwt'));
        req.user = decoded;
        next();
    } 
    catch (ex) 
    {
        res.status(400).send("Invalid token. User failed to provide a valid web token");
    }
};