const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { user } = require('../models/user');

const authMiddleware = async (req, res, next) => {
    let token;

        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
        }


    try {
        if (!token) {
            res.status(401).json({ msg: "Access denied. No token provided." });
            return;
        }

        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                res.status(401).json({ msg: "Invalid token." });
                return;
            }

            const loggedInUser = await user.findById(decoded.userId);
            if (!loggedInUser) {
                res.status(404).json({ msg: "User not found." });
                return;
            }

            req.user = {
                userId: loggedInUser._id,
                email: loggedInUser.email,
                name: loggedInUser.name,
            };

            next();
        });

    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};

module.exports = { authMiddleware };
