const express = require('express');
const CORS = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const morganMiddleware  = require('./middlewares/morganMiddleware ');
const logger = require("./utils/logger");
const helmet = require('helmet');
const { mainRouter } = require('./routes');
const { disconnect } = require('./database/db');

dotenv.config();
const PORT = process.env.PORT || 5000;

// Middlewares
const app = express();
app.use(CORS({
    origin: ['http://localhost:3000', ], // Allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(helmet());
app.use(morganMiddleware );


// filepath: server/index.js

app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal Server Error' });
});

// Default Route
app.get('/', (req, res) => {
    res.status(200).json({
        message: "API is running",
        status: "healthy",
    });
});

app.use('/api/v1', mainRouter);

// Hosting the server
let server;
const hostServer = async () => {
    try {
        if (!process.env.PORT) {
            logger.error('Error: PORT is not defined in the environment variables.');
            process.exit(1);
        }   
            server = app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    }
    catch (e) {
        logger.error(`Error starting server: ${e}`);
        process.exit(1);
    }
};
hostServer();

// Graceful Shutdown
const shutdown = async() => {
    logger.warn('Shutting down server...');
    try {
        await disconnect();
        logger.info('Database connection closed.');
    } catch (err) {
        logger.error('Error closing database connection:', err);
    }
    server.close(() => {
        logger.warn('Server closed.');
        process.exit(0);
    });
    
    // Fallback in case server.close() hangs
    setTimeout(() => {
        logger.error('Forcing process exit due to timeout.');
        process.exit(1);
    }, 30000); // 5 seconds timeout 
};


process.on('SIGINT', () => {
    console.info('SIGINT signal received.');
    shutdown();
  });
process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.');
    shutdown();
  });

// Global Error Handlers
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});