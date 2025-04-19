const express = require('express');
const logger = require('../utils/logger')
const zod = require('zod');
const jwt = require('jsonwebtoken');
const userRouter = express.Router();
const { User, Account } = require('../database/db');
const JWT_SECRET = require('../config/config');
const { authMiddleware } = require('../middlewares/middleware');

const validateRequest = (schema) => (req,res,next) => {
    const {success, error} = schema.safeParse(req.body);
    if(!success)
     {
        logger.error("Error in Zod Validation : " + error);
        return res.status(400).json({
            message: "Invalid Request",
            error: error
        });
     }
    next();
}

const filterSchema = zod.object({
    filter: zod
            .string()
            .regex(/^[a-zA-Z0-9]*$/, "Filter must only contain alphabetic characters and numbers")
            .min(3, "Filter must be at least 3 characters long"),
});

userRouter.get('/bulk', async (req, res) => {
    const filter = req.query.filter || "";
    const {success, error} = filterSchema.safeParse(req.query);
    if (!success) {
        logger.error("Error in Zod Validation : " + error);
        return res.status(400).json({
            message: "Invalid Request",
        });
    }
    //Input Sanitization is removed due to Zod filter
    const users = await User.find({
        $or: [
            { firstName: { $regex: filter, $options: "i" } }, // Case-insensitive search
            { lastName: { $regex: filter, $options: "i" } }
        ]
    })
    res.status(200).json({
        users: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
        }))
    })
})

const signinSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
});

userRouter.post('/signin', validateRequest(signinSchema), async (req, res) => {
    const body = req.body;
    try{
        const user = await User.findOne({
            username : body.username
        })
    
        if(user)
        {
            if(body.password === user.password)
                 {
                    const token = jwt.sign({
                        userId : user._id
                    }, JWT_SECRET)
                    return res.status(200).json({
                        message: "Sign In Successful",
                        token: token,
                    })
                 }
            else {
                logger.warn("Password didn't Match");
                return res.status(401).json({
                    message : "Incorrect Password",
                });
            }
        }
    
        else {
            logger.warn("Username Didn't Match");
            return res.status(400).json({
                message : "No such User Exists"
            })
        }
    }
    catch(err) {
        logger.error("Error in Processing Request : " + err.message);
        return res.status(500).json({
            message : "Error in Processing Request",
            error : err.message,
       }) 
    }
});

const signupSchemna = zod.object({
    username: zod.string(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string(),
})

userRouter.post('/signup', validateRequest(signupSchemna) , async (req, res) => {
    const body = req.body;
    const existingUser = await User.findOne({
        username: body.username
    });
    if(existingUser) {
        return res.status(400).json({
            message : "Email Already Taken / Incorrect Input"
        })
    }
    try {
        const user = await User.create(body);
        await Account.create({
            userId : user._id,
            balance : 0,
        })
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);
        
        res.status(200).json({
            message : "Post Request Successful : User Sign UP",
            token: token,
        })
    }
    catch(err) {
        logger.error("Error Creating User : " + err.message);
        res.status(500).json({
            message : "Internal Server Error",
            error: err.message,
        })
    }

});

const updateSchema = zod
    .object({
        password: zod.string().optional(),
        firstName: zod.string().optional(),
        lastName: zod.string().optional(),
    })    
    .refine(
        (data) => data.password || data.firstName || data.lastName,
        { message: "At least one field (password, firstName, or lastName) must be provided" }
    );

userRouter.put('/update', authMiddleware, validateRequest(updateSchema) , async (req,res) => {
    const body = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(req.userId, req.body);
        if(!updatedUser) {
            return res.status(404).json({
                message: "User not found",
            })
        }
        res.status(200).json({
            message : "User Updated"
        })
    }
    catch(err)
     {
        res.status(500).json({
            message: 'Error updating User',
            error: err.message,
        })
     }
})

module.exports = userRouter;