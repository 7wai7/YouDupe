import Router from 'express';
import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import { log } from 'console';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

import { authMiddleware } from '../middlewares/middlewares.js';
import { User } from '../models/User.js';
import Video from '../models/Video.js';
import Follower from '../models/Follower.js';
import Comment from '../models/Comment.js';
import Reaction from '../models/Reaction.js';
import mongoose from 'mongoose';
import History from '../models/History.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = new Router();


router.get('/', authMiddleware, async (req, res) => {
    const channels = req.user ? await Follower.find({ follower: req.user._id }).populate('user', 'login') : [];

    res.render('index', {
        title: 'YouDupe',
        stylesheets: ["index/index", 'header', 'footer'],
        scripts: ["index/script", 'header'],
        header: '../partials/header',
        footer: '../partials/footer',
        user: req.user,
        channels,
    });
});

router.get('/watch', authMiddleware, async (req, res) => {
    const id = req.query.v;
    if (!id) return res.redirect('/');

    const video = await Video.findById(id);
    if (!video) return res.redirect('/');

    

    await History.findOneAndUpdate(
        { video: video._id, user: req.user._id },
        { user: req.user._id, video: video._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const userChannel = await User.findById(video.user);

    const followers = await Follower.find({ user: userChannel._id });
    const followersCount = followers.length;

    const isFollowing = !!(await Follower.findOne({ user: userChannel._id, follower: req.user?._id }));

    const comments = await Comment.find({ video: video._id });
    const commentsCount = comments.length;


    const [aggregationResult] = await Reaction.aggregate([
        { $match: { video: video._id } },
        {
            $group: {
                _id: "$video",
                likes: { $sum: { $cond: [{ $eq: ["$reaction", true] }, 1, 0] } },
                dislikes: { $sum: { $cond: [{ $eq: ["$reaction", false] }, 1, 0] } }
            }
        }
    ]);
    const reactions = aggregationResult ?? { likes: 0, dislikes: 0 };

    const userReaction = req.user ? await Reaction.findOne({ video: video._id, user: req.user._id }).select("reaction").lean() : null;
    const channels = req.user ? await Follower.find({ follower: req.user._id }).populate('user', 'login') : [];

    res.render('watch', {
        title: video.title,
        stylesheets: ["watch/videoPlayer", "watch/watch", 'header', 'footer'],
        scripts: ["watch/buttons", 'header', "watch/script"],
        header: '../partials/header',
        footer: '../partials/footer',
        user: req.user,
        userChannel,
        followersCount,
        isFollowing,
        video,
        reactions,
        commentsCount,
        userReaction,
        channels,
    });
});

router.get('/subscriptions', authMiddleware, async (req, res) => {
    const channels = req.user ? await Follower.find({ follower: req.user._id }).populate('user', 'login') : [];

    res.render('index', {
        title: 'YouDupe',
        stylesheets: ["index/index", 'header', 'footer'],
        scripts: ["index/script", 'header'],
        header: '../partials/header',
        footer: '../partials/footer',
        user: req.user,
        channels,
    });
});

router.get('/channel/:login', authMiddleware, async (req, res) => {
    const userLogin = req.params.login;

    const userChannel = await User.findOne({ login: userLogin });
    if (!userChannel) return res.redirect('/');

    const followers = await Follower.find({ user: userChannel._id });
    const followersCount = followers.length;

    const videos = await Video.find({ user: userChannel._id });
    const isFollowing = !!(await Follower.findOne({ user: userChannel._id, follower: req.user?._id }));

    const channels = req.user ? await Follower.find({ follower: req.user._id }).populate('user', 'login') : [];

    res.render('channel', {
        title: userChannel.login,
        stylesheets: ["channel/styles", 'header', 'footer'],
        scripts: ["channel/script", 'header'],
        header: '../partials/header',
        footer: '../partials/footer',
        user: req.user,
        userChannel,
        videos,
        followersCount,
        isFollowing,
        channels,
    });
});

router.get('/studio', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json('Not registered');

    const filter = req.query.filter || "createdAt";
    const sort = req.query.sort || "down";

    const videos = await Video.find({ user: req.user._id });
    const videoCount = videos.length;

    res.render('studio', {
        title: 'Studio',
        stylesheets: ["studio/studio", 'studio/studioHeader'],
        scripts: ["studio/script"],
        header: '../partials/studioHeader',
        footer: '../partials/footer',
        user: req.user,
        videoCount,
        filter,
        sort
    });
});

router.get('/coming-soon', authMiddleware, async (req, res) => {
    const channels = req.user ? await Follower.find({ follower: req.user._id }).populate('user', 'login') : [];

    res.render('coming soon', {
        title: 'Coming soon',
        stylesheets: ["coming soon", 'header', 'footer'],
        scripts: ['header'],
        header: '../partials/header',
        footer: '../partials/footer',
        user: req.user,
        channels,
    });
});


// MOBILE PAGES

router.get('/mobile/notifications', authMiddleware, async (req, res) => {
    res.render('coming soon', {
        title: 'Coming soon',
        stylesheets: ['coming soon', 'header', 'footer'],
        scripts: ['header'],
        header: '../partials/header',
        footer: '../partials/footer',
        user: req.user,
        channels: [],
    })
})

router.get('/mobile/me', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json('Not registered');

    const historyVideos = await History.find({ user: req.user._id })
        .populate({
            path: 'video',
            populate: { path: 'user', select: 'login' } // Заповнюємо `user` всередині `video`
        })
        .sort({ updatedAt: -1 })
        .limit(10);

    res.render('me', {
        title: 'Me',
        stylesheets: ['me', 'header', 'footer'],
        scripts: ['header'],
        header: '../partials/header',
        footer: '../partials/footer',
        user: req.user,
        channels: [],
        historyVideos
    })
})


export default router;