import express from 'express';
import expressLayout from 'express-ejs-layouts';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import apiRouter from './routers/apiRouter.js';
import pageRoutes from './routers/pages.js';
import authRoutes from './routers/auth.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const DB_URL = "mongodb://localhost:27017/youdupe";

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(expressLayout);

app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.use("/api", apiRouter);
app.use("/api/auth", authRoutes);
app.use("/", pageRoutes);

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message });
});

/* app.get('*', (req, res) =>   {
    res.redirect('/');
}); */

async function startApp() {
    try {
        // await mongoose.connect(DB_URL);
        app.listen(PORT, () => console.log(`Сервер працює на порті: http://localhost:${PORT}`));
    } catch (error) {
        console.log(error);
    }
}

startApp();