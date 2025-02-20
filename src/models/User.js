import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    login: { type: String, required: true, minlength: 3, maxlength: 16 },
    email: { type: String, required: true, unique: true,
        validate: {
            validator: function(value) {
                return isEnableEmail(value);
            },
            message: "Email is not valid"
        }
    },
    password: { type: String, required: true, minlength: 6, maxlength: 12 }
}, {
    timestamps: true
});

function isEnableEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Хешування пароля перед збереженням
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);