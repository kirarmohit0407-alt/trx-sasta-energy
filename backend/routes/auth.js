// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // सुनिश्चित करें कि models/User.js मौजूद है

// Secret key for JWT (इसे .env file से आना चाहिए)
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key'; 

// --- 1. User Registration Route ---
// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields (email and password).' });
    }

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }

        // Create new user instance
        user = new User({ email, password });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save the user to the database
        await user.save();

        // Create and sign a JWT Token
        const payload = { userId: user.id };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1d' }, // Token 1 din ke liye valid rahega
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ 
                    msg: 'User registered successfully.',
                    token 
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during registration.');
    }
});

// --- 2. User Login Route ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields (email and password).' });
    }

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }

        // Check password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }

        // Create and sign a JWT Token (same as register)
        const payload = { userId: user.id };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    msg: 'Login successful.',
                    token,
                    userId: user.id // Frontend use ke liye userId bhi bhej rahe hain
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during login.');
    }
});

module.exports = router;