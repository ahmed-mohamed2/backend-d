const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const {notFound, errorHandler} = require('./middleware/errorMiddleware');
const languageMiddleware = require('./middleware/languageMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/trainers', require('./routes/trainerRoutes'));
app.use('/api/trainees', require('./routes/traineeRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);
app.use(languageMiddleware);
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
