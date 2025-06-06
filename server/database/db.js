const dotenv = require('dotenv');
dotenv.config();
const logger = require('../utils/logger')
const mongoose = require('mongoose');

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        logger.info("Connected to Mongo DB database");
    }   
    catch (e) {
        logger.error(`Error connecting to database: ${e.message}`, { stack: e.stack });
    }
}

const disconnect = async () => {
    try {
        await mongoose.connection.close();
        logger.info("Disconnected from Mongo DB database");
    } catch (e) {
        logger.error(`Error disconnecting from database: ${e.message}`, { stack: e.stack });
    }
};

connect();

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30,
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 30,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 30,
    },
});

const accountSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    balance: {
        type: Number,
        required: true,
    }
});

const User = mongoose.model('User', userSchema);
const Account = mongoose.model('Account', accountSchema);

module.exports = {
    disconnect,
    User,
    Account,
};
