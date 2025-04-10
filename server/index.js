const express = require('express');
const CORS = require('cors');
const dotenv = require('dotenv');
const { mainRouter } = require('./routes');
dotenv.config();
const PORT = process.env.PORT || 5000;

// Middlewares
const app = express();
app.use(CORS());
app.use(express.json());

// Default Route
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Get Request Successful",
    });
});

app.use('/api/v1', mainRouter);

// filepath: server/index.js
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Hosting the server
const hostServer = () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (e) {
        console.error(`Error starting server: ${e}`);
        process.exit(1);
    }
};
hostServer();