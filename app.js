const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) Define global middlewares
// Implement CORS
app.use(cors()); // set Access-Control-Allow-Origin to everything
// backend: asian-drama-lovers-api.com, front-end: asian-drama-lovers.com
// app.use(cors({ origin: 'https://asian-drama-lovers.com' })) // This is to allow Access-Control-Allow-Origin to only the front-end asian-drama-lovers.com

// This is to allow pre-flight for all routes
app.options('*', cors());
// This is to allow pre-flight for only a specific route
// app.options('/api/v1/users/:id', cors());

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
app.use('/api/v1/users', userRouter);

// 3) Global error handlind middlewares

// This is to send back an error whenever there is a request made to an undefined route. We must put this middleware after defined routes.
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  // Express will skip all middlewares in the middle and go straight to the global error handling middleware below
});

// This is the middleware that runs the globalErrorHandler. We must place this middleware at the bottom of the app.js file. Whenever the next function receives an error as an argument and gets called, this middleware will get called.
app.use(globalErrorHandler);

module.exports = app;
