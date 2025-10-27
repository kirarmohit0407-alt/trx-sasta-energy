// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const JWT_SECRET = process.env.JWT_SECRET || 'MyPasswordIsTheSecretSauceForTrendauraApp2025DAALEIN_12345'; // Live Env Variable is preferred

// --- 1. User Registration Route ---
// POST /api/auth/register
router.post('/register', async (req, res) => {
    // Log the attempt to see if request body is received (Debugging)
    console.log('Received registration attempt with body:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields (email and password).' });
    }

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            console.error(`REGISTRATION FAILED: Duplicate email found for ${email}`);
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }

        // 2. Create new user instance & Hash the password
        user = new User({ email, password });
        const salt = await bcrypt.genSalt(5);
        user.password = await bcrypt.hash(password, salt);

        // 3. Save the user (This is where final E11000 can be thrown)
        await user.save();
        console.log(`NEW USER REGISTERED successfully: ${email}`);

        // 4. Create and sign a JWT Token
        const payload = { userId: user.id };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1d' }, 
            (err, token) => {
                if (err) {
                    console.error('JWT Signing Error:', err);
                    throw err; // Throw to be caught by outer catch block
                }
                res.status(201).json({ 
                    msg: 'User registered successfully.',
                    token 
                });
            }
        );
    } catch (err) {
        // 🛑 Final Error Handling for Mongoose/Bcrypt errors 🛑
        
        // Handle explicit E11000 (Duplicate Key) error if it bypassed initial check
        if (err.code && err.code === 11000) {
            console.error(`E11000 CRITICAL ERROR: Database duplicate key error for email "${email}"`);
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }
        
        // Handle Mongoose Validation Errors (e.g., if email format is invalid)
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            console.error(`VALIDATION ERROR: ${messages.join(', ')}`);
            return res.status(400).json({ msg: messages.join(', ') });
        }

        // Handle all other errors (Bcrypt failure, DB write issues, etc.)
        console.error('SERVER ERROR DURING REGISTRATION:', err);
        res.status(500).send('Server Error: Registration could not be completed. Please try again.');
    }
});


// --- 2. User Login Route ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields (email and password).' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }

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
                    userId: user.id 
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during login.');
    }
});

module.exports = router;



