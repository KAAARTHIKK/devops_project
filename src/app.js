const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./lib/logger');
const requestId = require('./middleware/requestId');
const healthRouter = require('./routes/health');
const keysRouter = require('./routes/keys');
const proxyRouter = require('./routes/proxy');
const analyticsRouter = require('./routes/analytics');

const app = express();

app.use(requestId);
app.use(pinoHttp({ logger, genReqId: (req) => req.id }));
app.use(express.json());
app.use(healthRouter);
app.use(keysRouter);
app.use(proxyRouter);
app.use(analyticsRouter);

module.exports = app;
