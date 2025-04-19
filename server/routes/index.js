const express = require('express');
const userRouter = require('./user');
const accountRouter = require('./account');
const router = express.Router();


router.get('/', (req, res) => {
    res.status(200).json({
        message: "Get Request Successful : API V1",
        version: "1.0.0",
        status: "healthy",
    });
});

router.use('/user',userRouter);
router.use('/account',accountRouter);

module.exports = {
    mainRouter : router,
}