const express = require('express');
const router = express.Router();
const z = require('zod');
const { AbstractSubmission } = require('../models/user');
const { authMiddleware } = require("../controllers/authmiddleware");
const multer = require('multer');
const path = require('path');

router.use(express.json())

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/files');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname);
    }
});

const upload = multer({ storage });

const abstractSubmissionBody = z.object({
    correspondingAuthor: z.string().min(1, "Corresponding Author is required.").optional(),
    affiliationCorrespondingAuthor: z.string().min(1, "Affiliation of Corresponding Author is required.").optional(),
    author2: z.string().optional(),
    affiliationAuthor2: z.string().optional(),
    author3: z.string().optional(),
    affiliationAuthor3: z.string().optional(),
    author4: z.string().optional(),
    affiliationAuthor4: z.string().optional(),
    author5: z.string().optional(),
    affiliationAuthor5: z.string().optional(),
    titleOfPaper: z.string().min(1, "Title of Paper is required.").optional(),
    abstract: z.string().min(1, "Abstract is required.").optional()
});

router.use('/downloadfile', express.static(path.join(__dirname, './uploads/files')));

router.post('/abstract', authMiddleware, upload.single('abstractfile'), async (req, res) => {
    const parsed = abstractSubmissionBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: "Invalid data format", errors: parsed.error.errors });
    }

    if (!req.file) {
        return res.status(400).json({ msg: "File upload is required." });
    }

    const { correspondingAuthor, affiliationCorrespondingAuthor, author2, affiliationAuthor2, author3, affiliationAuthor3, author4, affiliationAuthor4, author5, affiliationAuthor5, titleOfPaper, abstract } = req.body;

    const userId = req.user.userId; 
    const email = req.user.email;
    const name = req.user.name;

    const newAbstract = new AbstractSubmission({
        correspondingAuthor,
        affiliationCorrespondingAuthor,
        author2,
        affiliationAuthor2,
        author3,
        affiliationAuthor3,
        author4,
        affiliationAuthor4,
        author5,
        affiliationAuthor5,
        titleOfPaper,
        abstract,
        abstractfile: req.file.filename,
        user: userId,
        username: name,
        useremail: email
    });

    await newAbstract.save();

    res.status(201).json({ msg: "Abstract successfully submitted" });
});

router.get('/allabstracts', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId; 
        const abstracts = await AbstractSubmission.find({ user: userId });

        if (abstracts.length === 0) {
            return res.status(404).json({ msg: "No abstracts found for the current user" });
        }

        res.status(200).json(abstracts);
    } catch (error) {
        console.error('Error fetching abstracts:', error);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
