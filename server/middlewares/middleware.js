const logger = require('../utils/logger');
const  JWT_SECRET = require('../config/config')
const jwt = require('jsonwebtoken');

const authMiddleware = (req,res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('UNAUTHORIZED | No Token Provided in Request')
        return res.status(401).json({
            message: "Unauthorized: No token provided",
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // logger.info("Authorized");
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch(err)
     {
        logger.error(`JWT verification error: ${err.message}`);
        return res.status(403).json({
            message: "Token Verification Failed",
        })
     }
}

module.exports = {
    authMiddleware
}