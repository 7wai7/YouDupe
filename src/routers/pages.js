import Router from 'express';
import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import { log } from 'console';
import Video from '../models/Video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = new Router();


router.get('/', async (req, res) => {
    const videos = await Video.find();

    res.render('index', {
        title: 'YouDupe',
        stylesheets: ["index/index", 'header'],
        scripts: ["index/buttons", 'header'],
        header: '../partials/header',
        videos
    });




    /* const videosPath = path.join(__dirname, '../../videos');

    fs.readdir(videosPath, (err, files) => {
        if (err) {
            console.error('Помилка читання папки:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        const videoFiles = files
            .map(file => path.parse(file).name); // Видаляємо розширення

        res.render('index', {
            title: 'YouDupe',
            stylesheets: ["index/index", 'header'],
            scripts: ["index/buttons", 'header'],
            header: '../partials/header',
            videos: videoFiles
        });
    }); */
});

router.get('/watch', async (req, res) => {
    const id = req.query.v;

    if (!id) return res.redirect('/');

    const video = await Video.findById(id);

    if(!video) return res.redirect('/');

    res.render('watchVideo', {
        title: id,
        stylesheets: ["watch/videoPlayer", "watch/watch", 'header'],
        scripts: ["watch/buttons", 'header', "watch/script"],
        header: '../partials/header',
        video,
    });
});

router.get('/channel', async (req, res) => {
    res.render('channel', {
        title: 'Channel',
        stylesheets: ["channel/styles", 'header'],
        scripts: ["channel/script", 'header'],
        header: '../partials/header',
    });
});

router.get('/studio', async (req, res) => {
    const filter = req.query.filter || "date";
    const sort = req.query.sort || "down";
    
    log(filter + ", " + sort);

    res.render('studio', {
        title: 'Studio',
        stylesheets: ["studio/studio", 'studio/studioHeader'],
        scripts: ["studio/script", 'studio/studioHeader'],
        header: '../partials/studioHeader',
        filter,
        sort
    });
});


export default router;