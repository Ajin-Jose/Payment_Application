const express = require('express');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const userRouter = express.Router();
const { User } = require('../database/db');
const JWT_SECRET = require('../config/config');
const argon2 = require('argon2');

userRouter.get('/', (req, res) => {
    console.log("Received a Get Request for User")
    res.status(200).json({
        message : "Get Request Successful : User",
    })
})

const signinSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
});

userRouter.post('/signin', async (req, res) => {
    console.log("Post Request Received : User Sign-In");
    const body = req.body;
    const {success} = signinSchema.safeParse(req.body);
    if(!success)
    {
        return res.status(400).json({
            message : "Invalid Inputs"
        })
    }

    console.log("Requst Body Parsed Successfully");
    try{
        const user = await User.findOne({
            username : body.username
        })
    
        if(user)
        {
            console.log("User Found");
            if(body.password === user.password)
                 {
                    console.log("Password Matched");
                    const token = jwt.sign({
                        userId : user._id
                    }, JWT_SECRET)
                    return res.status(200).json({
                        message: "Sign In Successful",
                        token: token,
                    })
                 }
            else {
                console.log("Password didn't Match");
                return res.status(401).json({
                    message : "Incorrect Password",
                });
            }
        }
    
        else {
            console.log("Username Didnt Match");
            return res.status(400).json({
                message : "No such User Exists"
            })
        }
    }
    catch(err) {
        console.log("Error in Processing Request : " + err)
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

userRouter.post('/signup', async (req, res) => {
    const body = req.body;
    const {success} = signupSchemna.safeParse(req.body);
    if(!success)
    {
        return res.status(400).json({
            message : "Email Already Taken / Incorrect Input"
        })
    }

    console.log("Requst Body Parsed Successfully");
    const existingUser = User.findOne({
        username: body.username
    })

    if(existingUser._id) {
        return res.status(400).json({
            message : "Email Already Taken / Incorrect Input"
        })
    }

    try {
        const user = await User.create(body);
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);
        
        res.status(200).json({
            message : "Post Request Successful : User Sign UP",
            token: token,
        })
    }
    catch(err) {
        console.log("Error Creating User : " + err);
        res.status(500).json({
            message : "Internal Server Error",
            error: err.message,
        })
    }

});

module.exports = userRouter;