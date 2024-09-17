const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/CANDEE-2024")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    }, 
    name: {
        type: String,
        required: true,    
    },
    password: {
        type: String,
      required: true
    }, 
    designation: {
        type: String,
        trim: true,
        // minLength: 2,
        maxLength: 100
    },
    affiliation: {
        type: String,

        trim: true,
        // minLength: 2,
        maxLength: 100
    },
    nationality: {
        type: String,

        trim: true,
        // minLength: 2,
        maxLength: 50
    },
    mailingAddress: {
        type: String,
        trim: true,
       // minLength: 5,
        maxLength: 200
    },
    fax: {
        type: String,
        trim: true,
       // minLength: 6,
        maxLength: 20
    },
    mobilePhoneNo: {
        type: String,
       // minLength: 8,
        maxLength: 20
    },
    profilepicture: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const abstractSubmissionSchema = new mongoose.Schema({
    correspondingAuthor: {
      type: String,
      required: true
    },
    affiliationCorrespondingAuthor: {
      type: String,
      required: true
    },
    author2: {
      type: String,
      default: "",
    },
    affiliationAuthor2: {
      type: String,
      default: "",
    },
    author3: {
      type: String,
      default: "",
    },
    affiliationAuthor3: {
      type: String,
      default: "",
    },
    author4: {
      type: String,
      default: "",
    },
    affiliationAuthor4: {
      type: String,
      default: "",
    },
    author5: {
      type: String,
      default: "",
    },
    affiliationAuthor5: {
      type: String,
      default: "",
    },
    titleOfPaper: {
      type: String,
      required: true
    },
    abstract: {
      type: String,
      required: true
    },
    abstractfile: {
        type: String,
        required: false
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    username: {
      type: String, 
      required: true
    },
    useremail: {
      type: String, 
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['succeeded', 'failed', 'cancelled', 'timeout'],
        required: true
    },
    razorpaySignature: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

paymentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Payment = mongoose.model("Payment", paymentSchema);
const AbstractSubmission = mongoose.model("AbstractSubmission", abstractSubmissionSchema);
const user = mongoose.model("User", userSchema);

module.exports = {
    user,
    AbstractSubmission,
    Payment
}


