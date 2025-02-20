import { Router } from 'express';
import User from '../models/User.js';

const router = new Router();


router.post('/signup', async (req, res, next) => {
    try {
        const { login, email, password, confirmedPassword } = req.body;

        if (!login || !email || !password || !confirmedPassword) {
            return res.status(400).json('Email, password and login are required')
        }

        if (password != confirmedPassword) {
            return res.status(400).json('Password confirmation is not equal to the password')
        }

        const user = await User.create({ email, password, login });
        const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY);

        res.cookie('token', token, { httpOnly: true, secure: true }); // httpOnly захищає від доступу через JS
        res.status(200).json({ message: "Successful signup." });
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "User not found." });

        const isMatch = user.comparePassword(password);

        if (!isMatch) return res.status(400).json({ message: "Invalid password." });

        const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY);

        res.cookie('token', token, { httpOnly: true, secure: true }); // httpOnly захищає від доступу через JS
        res.status(200).json({ message: "Successful signup." });
    } catch (err) {
        next(err);
    }
});

router.post('/logout', (req, res, next) => {
    try {
        res.clearCookie('login');
        return res.redirect('/');
    } catch (err) {
        next(err);
    }
})


export default router;
