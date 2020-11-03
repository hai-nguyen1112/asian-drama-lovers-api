const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');

const app = express();

// 1) Define global middlewares
// This is a middleware that allows the app to serve static files stored in public folder
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  })
);

// This is a middleware that limits requests from same API
// This is to allow 100 requests per hour for one IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
// This is to apply the limiter to only /api
app.use('/api', limiter);

// This is a middleware that adds the data in the body of the API request to the req argument passed in the route handler
app.use(express.json({ limit: '10kb' })); // If the body of the request is larger than 10kb, Express will not accept it.

// This is a middleware that parses the cookie
app.use(cookieParser());

// This is a middleware that does data sanitization against NoSQL query injection.
app.use(mongoSanitize());

// This is a middleware that does data sanitization against XSS attack.
app.use(xss());

app.use(compression());

// 2) Apply the routers

// 3) Global error handlind middlewares

module.exports = app;
