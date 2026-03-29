const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'AI Student Productivity OS API is running' });
});

app.use('/api/auth', authRoutes);

app.get('/api/user/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
  });
});

app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.name || req.user.email}!`,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
