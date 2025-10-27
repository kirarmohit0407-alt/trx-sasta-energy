// routes/auth.js (Finalized Bypass Code)

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const JWT_SECRET = process.env.JWT_SECRET || 'MyPasswordIsTheSecretSauceForTrendauraApp2025DAALEIN_12345'; 

// --- 1. User Registration Route ---
// POST /api/auth/register
router.post('/register', async (req, res) => {
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

        // 2. Create new user instance (Note: No hashing)
        user = new User({ email, password });
        
        // 🛑 BYPASS FIX: Password plain text में सेव हो रहा है (UNSAFE)
        user.password = password; 

        // 3. Save the user
        await user.save();
        console.log(`NEW USER REGISTERED successfully (BYPASS MODE): ${email}`);

        // 4. Create and sign a JWT Token
        const payload = { userId: user.id };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }, 
            (err, token) => {
                if (err) {
                    console.error('JWT Signing Error:', err);
                    throw err; 
                }
                res.status(201).json({ 
                    msg: 'User registered successfully.',
                    token 
                });
            }
        );
    } catch (err) {
        // Handle E11000 or other DB write issues
        if (err.code && err.code === 11000) {
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }
        console.error('SERVER ERROR DURING REGISTRATION (Plain Text Mode):', err);
        res.status(500).send('Server Error: Registration could not be completed.');
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
        
        // 🛑 BYPASS FIX: Simple string compare
        const isMatch = (password === user.password); 
        
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }

        // Create and sign a JWT Token
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
