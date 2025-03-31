const express = require('express');
const userRouter = express.Router();
const { User } = require('../database/db');

userRouter.get('/', (req, res) => {
    res.status(200).json({
        message : "Get Request Successful : User",
    })
})

userRouter.post('/signin', async (req, res) => {
    res.status(200).json({
        message : "Post Request Successful : User Sign In",
    })
});

userRouter.post('/signup', async (req, res) => {
    res.status(200).json({
        message : "Post Request Successful : User Sign In",
    })
});

module.exports = userRouter;