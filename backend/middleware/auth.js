// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // 1. Token ko do sources se nikalne ki koshish karo: 
    // a) Standard 'x-auth-token' header
    // b) 'Authorization: Bearer <token>' header
    
    let token = req.header('x-auth-token');

    // Agar standard header mein nahi mila, toh Bearer format check karo
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        // Bearer token se sirf token value extract karo
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. Agar token ab bhi nahi mila
    if (!token) {
        return res.status(401).json({ msg: 'No token found, authorization denied.' });
    }

    // 3. Token ko verify karo
    try {
        // Token ko verify karte samay process.env.JWT_SECRET ka upyog karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // decoded payload se user ID ko req.userId mein set karo
        req.userId = decoded.userId; 
        
        next(); // Agle middleware/route par jao
    } catch (err) {
        // Agar token invalid, expired, ya corrupted hai
        res.status(401).json({ msg: 'Token is not valid or has expired.' });
    }
};

module.exports = auth;