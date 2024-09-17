const express = require('express');
const router = express.Router();
const z = require('zod');
const { user } = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { authMiddleware } = require("../controllers/authmiddleware");
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/images');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname); // Unique filename
    }
});

const upload = multer({ storage });

const signupBody = z.object({
    email: z.string().email("Invalid email format"),
    name: z.string(),
    password: z.string(),
    designation: z.string().optional(),
    affiliation: z.string().optional(),
    nationality: z.string().optional(),
    mailingAddress: z.string().optional(),
    fax: z.string().optional(),
    mobilePhoneNo: z.string().optional(),
});

router.post('/signup', upload.single('profilepicture'), async (req, res) => {
    const parsed = signupBody.safeParse(req.body);
    console.log(req.body, "is the body");
    console.log(req.file,"is the file")
    
    if (!parsed.success) {
        return res.status(400).json({ msg: "Invalid data format", errors: parsed.error.errors });
    }

    const existingUser = await user.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(409).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    const newUser = new user({
        email: req.body.email,
        name: req.body.name,
        password: hashedPassword,
        designation: req.body.designation,
        affiliation: req.body.affiliation,
        nationality: req.body.nationality,
        mailingAddress: req.body.mailingAddress,
        fax: req.body.fax,
        mobilePhoneNo: req.body.mobilePhoneNo,
        profilepicture: req.file ? req.file.filename : null, 
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'none',
        maxAge: 3600000
    });

    res.status(201).json({ msg: "User successfully created" , accessToken: token});
});

const loginBody = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

router.post('/login', async (req, res) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: "Invalid data format" });
    }

    const existingUser = await user.findOne({ email: req.body.email });
    if (!existingUser) {
        return res.status(401).json({ msg: "User not found. Please register first." });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, existingUser.password);
    if (!isPasswordValid) {
        return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: existingUser._id }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'none',
        maxAge: 3600000
    });

    res.status(200).json({ msg: "User successfully logged in" , accessToken:token});
});

router.get('/logout', authMiddleware, (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'none'
    });
    res.status(200).json({ msg: "Successfully logged out" });
});

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userProfile = await user.findById(userId).select('profilepicture name title designation email');
        
        if (!userProfile) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.status(200).json({
            profilepicture: userProfile.profilepicture,
            fullName: userProfile.name,
            email: userProfile.email,
            title: userProfile.title,
            designation: userProfile.designation,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
});

const updateUserBody = z.object({
    password: z.string().min(8).optional(),
    title: z.enum(['Prof.', 'Dr.', 'Mr.', 'Ms.', 'Mrs.']).optional(),
    fullName: z.string().min(2).optional(),
    designation: z.string().min(2).optional(),
    affiliation: z.string().min(2).optional(),
    category: z.enum(['Faculty', 'Scientist', 'PDF']).optional(),
    maritalStatus: z.enum(['Single', 'Married']).optional(),
    nationality: z.string().min(2).optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    mailingAddress: z.string().min(2).optional(),
    fax: z.string().optional(),
    mobilePhoneNo: z.string().min(10).optional(),
});

router.put('/update', upload.single('profilepicture'), authMiddleware, async (req, res) => {
    const parsed = updateUserBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: "Invalid data format" });
    }

    const userId = req.user.userId;
    const updatedData = { ...parsed.data };

    if (updatedData.password) {
        updatedData.password = await bcrypt.hash(updatedData.password, 10);
    }

    if (req.file) {
        updatedData.profilepicture = req.file.filename;
    }

    const updatedUser = await user.findByIdAndUpdate(userId, updatedData, { new: true });

    res.status(200).json({ msg: "User information updated successfully", user: updatedUser });
});

module.exports = router;
