const express = require('express')
const userRouter = require('./user');
const AbstractSubmission  = require('./abstract');
const Payments = require('./payments')
const router = express.Router();

router.use("/user",userRouter);
router.use("/abstracts", AbstractSubmission);
router.use("/payments", Payments);

module.exports = router;