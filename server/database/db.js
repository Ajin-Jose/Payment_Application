const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to Mongo DB database");
    }   
    catch (e) {
        console.log(`Error connecting to database: ${e}`);
        process.exit(1);
    }
}

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

const User = mongoose.model('User', userSchema);

module.exports = {
    User,
};
