const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./lib/logger');
const requestId = require('./middleware/requestId');
const healthRouter = require('./routes/health');
const keysRouter = require('./routes/keys');

const app = express();

app.use(requestId);
app.use(pinoHttp({ logger, genReqId: (req) => req.id }));
app.use(express.json());
app.use(healthRouter);
app.use(keysRouter);

module.exports = app;
