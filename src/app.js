const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./lib/logger');
const requestId = require('./middleware/requestId');
const healthRouter = require('./routes/health');
const keysRouter = require('./routes/keys');
const auth = require('./middleware/auth');

const app = express();

app.use(requestId);
app.use(pinoHttp({ logger, genReqId: (req) => req.id }));
app.use(express.json());
app.use(healthRouter);
app.use(keysRouter);

// ponytail: temporary probe route to verify auth middleware; replaced by routes/proxy.js in Phase 6
app.get('/v1/_authcheck', auth, (req, res) => res.json({ apiKey: req.apiKey }));

module.exports = app;
