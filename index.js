import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { check, validationResult } from 'express-validator';
import db from './db.js';

const app = express();
app.use(bodyParser.json());

// Dummy secret key (replace this with a secure secret key for JWT)
const JWT_SECRET_KEY = 'fasdkljio234jkohvsdjk';

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
});

// User Model
const User = mongoose.model('User', userSchema);

// Middleware for validating JWT token
app.use((req, res, next) => {
  // res.header('Access-Control-Allow-Origin', 'http://localhost:5173'); // Update with your frontend origin
  res.header('Access-Control-Allow-Origin', 'https://actech-dashboard.netlify.app'); 
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
      return res.status(200).json({});
  }
  next();
});

// Register endpoint
app.post('/api/user/register', [
  check('username').notEmpty().withMessage('Username is required'),
  check('email').isEmail(),
  check('password').isLength({ min: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  try {
      const { username, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: 'User with this email already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, email, password: hashedPassword });
      await user.save();
      res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


// Login endpoint
app.post('/api/user/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('Cannot find user');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send('Incorrect password');
        }

        const token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
});
app.get('/api/user/search', async (req, res) => {
  const { term } = req.query;

  try {
      const users = await User.find({
          $or: [
              { username: { $regex: term, $options: 'i' } },
              { email: { $regex: term, $options: 'i' } }
          ]
      });

      res.status(200).json(users);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/user', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

// Read single user endpoint
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

// Update endpoint
app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.findByIdAndUpdate(id, { username, email, password: hashedPassword });
    
    res.status(200).send('User updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

// Delete endpoint
app.delete('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await User.findByIdAndDelete(id);
    
    res.status(200).send('User deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

// Update endpoint for toggling user active status
app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Update the active status of the user
    user.isActive = isActive;
    await user.save();

    res.status(200).json({ message: 'User active status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.get('/', (req, res) => {
  res.send('dashboard working good');
});



const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
