require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const connectDB = require('./config/db');
const requireAuth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const budgetRoutes = require('./routes/budgets');
const insightsRoutes = require('./routes/insights');
const settingsRoutes = require('./routes/settings');
const lendingRoutes = require('./routes/lending');

const app = express();
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'https://personal-expense-management-system-liard.vercel.app').split(',').map(x => x.trim());
app.use(helmet());
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error('Origin is not allowed by CORS.')); }, credentials: true }));
app.use(express.json({ limit: '30kb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many authentication attempts. Please try again later.' } });
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'pocketwise-api' }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', requireAuth);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/lending', lendingRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ message: 'A record with these details already exists.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(x => x.message).join(' ') });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid record identifier.' });
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({ message: status < 500 ? error.message : (process.env.NODE_ENV === 'production' ? 'Internal server error.' : error.message) });
});

const port = Number(process.env.PORT || 5000);
if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  console.error('JWT_ACCESS_SECRET is missing or too short. Set a random secret of at least 32 characters in server/.env.');
  process.exit(1);
}
connectDB().then(() => app.listen(port, () => console.log(`Pocketwise API running at http://localhost:${port}`)))
  .catch(error => { console.error('Could not start API:', error.message); process.exit(1); });
