const express = require('express');
const userRouter = require('./user');
const router = express.Router();


router.get('/', (req, res) => {
    res.status(200).json({
        message: "Get Request Successful : API V1",
    });
});

router.use('/user',userRouter);

module.exports = {
    mainRouter : router,
}