const express = require('express');
const accountRouter = express.Router();
const { authMiddleware } = require('../middlewares/middleware');
const logger = require('../utils/logger');
const zod = require('zod');
const { User, Account } = require('../database/db');
const { mongoose } = require('mongoose');

const validateRequest = (schema) => (req, res, next) => {
    const {success, error} = schema.safeParse(req.body);
    if(!success)
     {
        logger.error("Error in Zod Validation : " + error);
        return res.status(400).json({
            message: "Invalid Request",
        });
     }
    next();
}
const updateFunds = async(accountId, amount) => {
    try {
        await Account.findByIdAndUpdate(accountId, {
            $inc: {balance: amount}
        });
    }
    catch(err)
    {
        logger.error("Transaction Falied : " + err);
        throw new Error("Transaction Failed");
    }

}

const transferSchema = zod.object({
    receiverAccountUsername: zod.string(),
    amount: zod
            .number()
            .positive("Amount must be greater than zero"),
});

accountRouter.get('/balance', authMiddleware, async(req,res) => {
    try {
        const {balance} = await Account.findOne({ userId : req.userId });
        res.status(200).json({
            message : "Balance Fetched Successfully",
            balance : balance,
        })
    }
    catch(err) {
        logger.error(`Error in fetching balance for User ${req.userId} :  ${err}`);
        res.status(500).json({
            message : 'Internal Server Error',
        })
    }
});

accountRouter.post('/transfer', authMiddleware, validateRequest(transferSchema) , async (req,res) => {
    const { receiverAccountUsername, amount} = req.body;
    try {
        const receiver = await User.findOne({
            username: receiverAccountUsername
        });

        if(!receiver)
        {
            logger.error("Receiver not found");
            return res.status(404).json({
                message: "Receiver not Found"
            });
        }
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const senderAccount = await Account.findOne({ userId: req.userId }).session(session);
            const receiverAccount = await Account.findOne({ userId: receiver._id }).session(session);
            
            if(!senderAccount || senderAccount.balance < amount)
            {
                await session.abortTransaction();
                return res.status(400).json({
                    message: "Insufficient Balance",
                });
            }
    
            if(!receiverAccount)
            {
                await session.abortTransaction();
                return res.status(400).json({
                    message: "Invalid Account",
                });
            }
    
            // Performing Transaction
            await Account.updateOne({userId: req.userId}, { $inc: {balance: -amount }}).session(session);
            await Account.updateOne({userId: receiver._id}, { $inc: {balance: amount }}).session(session);
    
            // Committing Transaction
            await session.commitTransaction();
            return res.status(200).json({
                message: 'Transaction Successful',  
            });
        }
        catch(err) {
            await session.abortTransaction();
            logger.error("Error during transfer: " + err.message);
            return res.status(500).json({
                message: "Internal Server Error",
            });
        }
        finally {
            session.endSession();
        }
    }
    catch(err)
    {
        logger.error("Error during transfer : " + err.message);
        return res.status(500).json({
            message: "Internal Server Error",
        })
    }
});
const moneySchema = zod.object({
    amount: zod
            .number()
            .positive("Amount must be greater than zero")
            .int("Amount must be a whole number"),
})
accountRouter.put('/deposit', authMiddleware, validateRequest(moneySchema), async (req,res) => {
    const { amount } = req.body;
    try {
        const account = await Account.findOne({
            userId : req.userId
        });
        if(!account)
            {
                logger.error("Account not found");
                return res.status(404).json({
                    message: "Account not found",
                });
            } 
        await updateFunds(account._id, amount);
        return res.status(200).json({
            message: "Transaction Successful",
        });
    }
    catch(err)
    {
        logger.error("Error while processing deposit: " + err.message);
        return res.status(500).json({
            message : "Internal Server Error",
        })
    }

});
accountRouter.put('/withdraw', authMiddleware, validateRequest(moneySchema), async (req,res) => {
    const { amount } = req.body;
    try {
        const account = await Account.findOne({
            userId : req.userId
        });
        if(!account)
            {
                logger.error("Account not found");
                return res.status(404).json({
                    message: "Account not found",
                });
            }
        if(account.balance<amount)
            {
                logger.error("Insufficient Balance");
                return res.status(400).json({
                    message: "Insufficient Balance",
                });
            } 
        await updateFunds(account._id, ((-1)*amount));
        return res.status(200).json({
            message: "Transaction Successful",
        });
    }   
    catch(err)
    {
        logger.error("Error while processing withdrawal: " + err.message);
        return res.status(500).json({
            message : "Internal Server Error",
        })
    }
});
accountRouter.post('/initiateAccount', authMiddleware, validateRequest(moneySchema), async (req,res) => {
    const { amount } = req.body;
    try {
        const existingAccount = await Account.findOne({ userId: req.userId });
        if (existingAccount) {
            logger.error("Account already exists for user");
            return res.status(400).json({
                message: "Account already exists",
            });
        }
        await Account.create({
            userId: req.userId,
            balance: amount,
        });
        return res.status(201).json({
            message : "Account Created Successfully",
        });
    }
    catch(err)
    {
        logger.error("Error in initiating account for User : " + err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
})

module.exports = accountRouter;
