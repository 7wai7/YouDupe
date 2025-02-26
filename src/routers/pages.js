import Router from 'express';
import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import { log } from 'console';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

import { authMiddleware } from '../middlewares/middlewares.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Follower from '../models/Follower.js';
import Comment from '../models/Comment.js';
import Reaction from '../models/Reaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = new Router();


router.get('/', authMiddleware, async (req, res) => {
    const videos = await Video.find().populate('user', 'login');

    res.render('index', {
        title: 'YouDupe',
        stylesheets: ["index/index", 'header'],
        scripts: ["index/buttons", 'header'],
        header: '../partials/header',
        user: req.user,
        formatDistanceToNow,
        uk,
        videos,
    });
});

router.get('/watch', authMiddleware, async (req, res) => {
    const id = req.query.v;
    if (!id) return res.redirect('/');

    const video = await Video.findById(id);
    if(!video) return res.redirect('/');

    const userChannel = await User.findById(video.user);
    if(!userChannel) return res.redirect('/');

    const followers = await Follower.find({ user: userChannel._id });
    const followersCount = followers.length;


    const comments = await Comment.find({ video: video._id });
    const commentsCount = comments.length;


    const reactions = await Reaction.find({ video: video._id });
    const reactionCount = { likes: 0, dislikes: 0 };

    reactions.forEach(reaction => {
        if (reaction.reaction) {
            reactionCount.likes++;
        } else {
            reactionCount.dislikes++;
        }
    });

    const userId = req.user?._id;
    let userReaction = undefined;
    if (userId) {
        userReaction = reactions.find(reaction => reaction.user.toString() === userId.toString())?.reaction; // true (like) / false (dislike)   
    }

    res.render('watchVideo', {
        title: id,
        stylesheets: ["watch/videoPlayer", "watch/watch", 'header'],
        scripts: ["watch/buttons", 'header', "watch/script"],
        header: '../partials/header',
        user: req.user,
        userChannel,
        followersCount,
        video,
        commentsCount,
        reactionCount,
        userReaction
    });
});

router.get('/channel/:login', authMiddleware, async (req, res) => {
    const userLogin = req.params.login;

    const userChannel = await User.findOne({ login: userLogin });
    if(!userChannel) return res.redirect('/');

    const videos = await Video.find({ user: userChannel._id });

    res.render('channel', {
        title: userChannel.login,
        stylesheets: ["channel/styles", 'header'],
        scripts: ["channel/script", 'header'],
        header: '../partials/header',
        user: req.user,
        userChannel,
        videos
    });
});

router.get('/studio', authMiddleware, async (req, res) => {
    const filter = req.query.filter || "createdAt";
    const sort = req.query.sort || "down";
    
    res.render('studio', {
        title: 'Studio',
        stylesheets: ["studio/studio", 'studio/studioHeader'],
        scripts: ["studio/script", 'studio/studioHeader'],
        header: '../partials/studioHeader',
        user: req.user,
        filter,
        sort
    });
});


export default router;