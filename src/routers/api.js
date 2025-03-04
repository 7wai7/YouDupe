import Router from 'express';
import fs from "fs";
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

import { authMiddleware } from '../middlewares/middlewares.js';
import Video from '../models/Video.js';
import { User } from '../models/User.js';
import Comment from '../models/Comment.js';
import Reaction from '../models/Reaction.js';
import { deleteComment, deleteVideo } from '../service.js';
import mongoose from 'mongoose';
import Follower from '../models/Follower.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') cb(null, "videos/");
        else if (file.fieldname === 'preview') cb(null, "previews/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, req.videoId + ext);
    }
});
const upload = multer({ storage });


const router = new Router();


// GETTERS

router.get('/me', authMiddleware, (req, res) => {
    console.log(req.user);
    
    if (req.user) res.status(200).json({ message: 'Authorised' });
    else res.status(401).json({ message: 'Not registered' });
});

router.get("/video/:id", (req, res) => {
    const id = req.params.id;

    if (!id) return;

    const videoPath = `videos/${id}.mp4`;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        // Витягуємо початковий та кінцевий байти (наприклад, "bytes=1000-")
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunkSize = end - start + 1;
        const file = fs.createReadStream(videoPath, { start, end });

        const head = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4",
        };

        res.writeHead(206, head);
        file.pipe(res);
    }
});

router.get('/preview/:id', (req, res) => {
    const previewPath = path.join(__dirname, '../../previews', `${req.params.id}.png`);

    // Перевіряємо, чи існує файл
    if (fs.existsSync(previewPath)) {
        res.sendFile(previewPath);
    } else {
        res.status(404).send('Прев’ю не знайдено');
    }
});

router.get("/video/download/:id", (req, res) => {
    const id = req.params.id;
    if (!id) return;

    const videoPath = `videos/${id}.mp4`;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

    // Віддаємо весь файл
    const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
});



// AJAX GETTERS

router.get('/index/videos', async (req, res) => {
    try {
        const videos = await Video.find().populate('user', 'login');
        
        res.render('partials/index video', {
            videos,
            formatDistanceToNow,
            uk,
            layout: false
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.get('/subscriptions/videos', authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not registered' });

        const videos = await Video.aggregate([
            {
                $lookup: {
                    from: 'followers',
                    localField: 'user',   // Поле в "videos", яке містить ID користувача
                    foreignField: 'user', // Поле в "followers", яке вказує на користувача
                    as: 'followers'
                }
            },
            {
                $match: {
                    'followers.follower': req.user._id  // Фільтруємо, щоб підписник був req.user
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 10 }
        ]);

        const populatedVideos = await Video.populate(videos, {
            path: 'user',
            select: 'login'
        });
        
        res.render('partials/index video', {
            videos: populatedVideos,
            formatDistanceToNow,
            uk,
            layout: false
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.get("/header/notifications", authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not registered' });

        const notifications = await Video.aggregate([
            {
                $lookup: {
                    from: 'followers',
                    localField: 'user',   // Автор відео
                    foreignField: 'user', // Кого фоловлять
                    as: 'followers'
                }
            },
            {
                $match: {
                    'followers.follower': req.user._id  // Юзер підписаний
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $project: { "user.login": 1, "title": 1, "createdAt": 1, "type": "video" } },
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
        
            // Об'єднуємо з коментарями
            {
                $unionWith: {
                    coll: "comments",
                    pipeline: [
                        { $match: { taggedUser: req.user._id } },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        { $unwind: "$user" },
                        { $project: { "user.login": 1, "text": 1, "createdAt": 1, "type": "comment" } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 10 }
                    ]
                }
            },
        
            // Фінальне сортування
            { $sort: { createdAt: -1 } },
            { $limit: 10 }
        ]);


        res.render('partials/notification', {
            notifications,
            formatDistanceToNow,
            uk,
            layout: false
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.get("/watch/recommendedVideos", async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const current_video = req.query.current_video;

        let query = Video.find()
            .populate('user', 'login')
            .sort({ createdAt: 1 })
            .skip(offset)
            .limit(limit);

        if (current_video) {
            query = query.where('_id').ne(current_video);
        }

        const videos = await query;
            

        res.render('partials/recommended video', {
            videos,
            formatDistanceToNow,
            uk,
            layout: false
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.get("/comments", authMiddleware, async (req, res) => {
    try {
        const videoId = new mongoose.Types.ObjectId(req.query.video);
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || "popular"; // "popular" -> за лайками, "newer" -> за датою

        const comments = await Comment.aggregate([
            { $match: { video: videoId, parentComment: null } },

            // Підвантажуємо користувачів (тільки логін)
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user" } }, // Робимо об'єктом, а не масивом
            { $project: { "user.password": 0 } }, // Виключаємо зайві дані

            // Підвантажуємо реакції
            {
                $lookup: {
                    from: "reactions",
                    localField: "_id",
                    foreignField: "comment",
                    as: "reactions"
                }
            },
            {
                $addFields: {
                    likes: {
                        $size: {
                            $filter: {
                                input: "$reactions",
                                as: "r",
                                cond: { $eq: ["$$r.reaction", true] }
                            }
                        }
                    },
                    dislikes: {
                        $size: {
                            $filter: {
                                input: "$reactions",
                                as: "r",
                                cond: { $eq: ["$$r.reaction", false] }
                            }
                        }
                    },
                    // Додаємо поле "userReaction" (чи лайкнув / дизлайкнув користувач)
                    userReaction: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$reactions",
                                    as: "r",
                                    cond: { $eq: ["$$r.user", new mongoose.Types.ObjectId(req.user?._id)] }
                                }
                            },
                            0
                        ]
                    }
                }
            },

            // Підраховуємо чи є відповіді
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "parentComment",
                    as: "replies"
                }
            },
            { $addFields: { hasReply: { $gt: [{ $size: "$replies" }, 0] } } },

            // Видаляємо зайві поля
            { $project: { replies: 0, reactions: 0 } },

            { $sort: sort === "newer" ? { createdAt: 1, _id: 1 } : { likes: -1, _id: 1 } },
            { $skip: offset },
            { $limit: limit }
        ]);

        // Додаємо `canDelete`
        comments.forEach(comment => {
            comment.canDelete =
                req.user &&
                (comment.user._id.toString() === req.user._id.toString() ||
                    req.user.role === "admin" ||
                    req.user.role === "moderator");

            comment.canComplain = req.user && comment.user._id.toString() !== req.user._id.toString();

            // Перетворюємо `userReaction` в `true`, `false` або `null`
            comment.userReaction = comment.userReaction?.reaction ?? null;
        });

        res.render('partials/comment', {
            user: req.user,
            comments,
            isParentComment: true,
            formatDistanceToNow,
            uk,
            layout: false
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/comments/replies", authMiddleware, async (req, res) => {
    try {
        const videoId = new mongoose.Types.ObjectId(req.query.video);
        const commentId = new mongoose.Types.ObjectId(req.query.comment);
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const comments = await Comment.aggregate([
            { $match: { video: videoId, parentComment: commentId } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: "$user" } },
            { $project: { "user.password": 0 } },
            {
                $lookup: {
                    from: 'reactions',
                    localField: '_id',
                    foreignField: 'comment',
                    as: 'reactions'
                }
            },
            {
                $addFields: {
                    likes: {
                        $size: {
                            $filter: {
                                input: "$reactions",
                                as: "r",
                                cond: { $eq: ["$$r.reaction", true] }
                            }
                        }
                    },
                    dislikes: {
                        $size: {
                            $filter: {
                                input: "$reactions",
                                as: "r",
                                cond: { $eq: ["$$r.reaction", false] }
                            }
                        }
                    },
                    // Додаємо поле "userReaction" (чи лайкнув / дизлайкнув користувач)
                    userReaction: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$reactions",
                                    as: "r",
                                    cond: { $eq: ["$$r.user", new mongoose.Types.ObjectId(req.user?._id)] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            { $project: { reactions: 0 } },
            { $sort: { createdAt: 1 } },
            { $skip: offset },
            { $limit: limit }
        ]);

        comments.forEach(comment => {
            comment.canDelete =
                req.user &&
                (comment.user._id.toString() === req.user._id.toString() ||
                    req.user.role === "admin" ||
                    req.user.role === "moderator");

            // Перетворюємо `userReaction` в `true`, `false` або `null`
            comment.userReaction = comment.userReaction?.reaction ?? null;
        });


        console.log(comments);
        

        res.render('partials/comment', {
            user: req.user,
            comments,
            isParentComment: false,
            formatDistanceToNow,
            uk,
            layout: false
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.get("/studio/videos", authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not registered' });

        const filter = req.query.filter || "date";
        const sort = req.query.sort === 'up' ? 1 : -1;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;


        const sortedVideos = await Video.aggregate([
            { $match: { user: req.user._id } }, // Вибираємо всі відео користувача
            {
                $lookup: {
                    from: "reactions",
                    localField: "_id",
                    foreignField: "video",
                    as: "reactions"
                }
            }, // Підтягуємо реакції
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "video",
                    as: "comments"
                }
            }, // Підтягуємо коментарі
            {
                $addFields: {
                    likes: {
                        $size: {
                            $filter: { input: "$reactions", as: "r", cond: { $eq: ["$$r.reaction", true] } }
                        }
                    },
                    dislikes: {
                        $size: {
                            $filter: { input: "$reactions", as: "r", cond: { $eq: ["$$r.reaction", false] } }
                        }
                    },
                    comments: { $size: "$comments" }
                }
            }, // Додаємо підрахунки лайків, дизлайків і коментарів
            { $sort: { [filter]: sort } }, // Динамічне сортування
            { $skip: offset }, // Пропускаємо зайві елементи
            { $limit: limit } // Обмежуємо кількість результатів
        ]);

        res.render('partials/studio video', { videos: sortedVideos, layout: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/video/:id/description", async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        res.json({ description: video.description });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
})

router.get("/channel/:login/videos", async (req, res) => {
    try {
        const userLogin = req.params.login;
        const sort = req.query.sort || "newer";
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const userChannel = await User.findOne({ login: userLogin });
        if (!userChannel) return res.status(404).render('partials/channel video', { videos: [], layout: false });

        const videos = await Video.aggregate([
            { $match: { user: userChannel._id } },
            { $sort: { [sort === 'newer' ? 'createdAt' : 'views']: -1 } },
            { $skip: offset },
            { $limit: limit }
        ]);

        res.render('partials/channel video', {
            videos,
            formatDistanceToNow,
            uk,
            layout: false
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})




// POSTS

router.post("/studio/upload", authMiddleware, async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json('Not registered');

        // Створюємо новий документ в базі (ID буде одразу доступним)
        const video = new Video({});
        req.videoId = video._id.toString(); // Зберігаємо ID для використання в Multer

        // Виконуємо Multer для завантаження файлів
        upload.fields([
            { name: "video", maxCount: 1 },
            { name: "preview", maxCount: 1 }
        ])(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ error: "Error uploading files" });
            }
            if (!req.files || !req.files.video) {
                return res.status(400).json({ error: "Video not uploaded" });
            }
            if (!req.files.preview) {
                return res.status(400).json({ error: "Preview not uploaded" });
            }

            ffmpeg.ffprobe(path.join(__dirname, `../../${req.files.video[0].path}`), async function (err, metadata) {
                if (err) {
                    console.error("Error retrieving metadata:", err);
                    return res.status(500).json({ error: "Unable to retrieve video information" });
                }

                // Зберігаємо інформацію про відео в базу
                video.user = req.user._id;
                video.filename = req.files.video[0].filename;
                video.preview = req.files.preview[0].filename;
                video.duration = metadata.format.duration;
                video.title = req.body.title || "Untitled";
                video.description = req.body.description || "";

                await video.save();

                res.json({ message: "Video has been successfully uploaded" });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.post("/comment", authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json('Not registered');

        const videoId = req.query.video;
        const text = req.body.text;

        const comment = new Comment({
            user: req.user,
            video: videoId,
            text
        });

        await comment.save();

        res.json({ text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.post("/comment/reply", authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json('Not registered');

        const videoId = req.query.video;
        const parentCommentId = req.query.parentComment;
        const taggedUser = req.query.taggedUser;
        const text = req.body.text;

        const comment = new Comment({
            user: req.user,
            video: videoId,
            parentComment: parentCommentId,
            taggedUser,
            text
        });

        await comment.save();

        res.json({ text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})



// PUTS

router.put("/:type/:id/reaction/:reaction", authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json('Not registered');

        const userId = req.user._id;
        const { type, id } = req.params;
        const reaction = Boolean(parseInt(req.params.reaction));

        if (type !== "comment" && type !== "video") {
            return res.status(400).json({ message: "Invalid reaction type" });
        }


        let filter = { user: userId };
        if (type === "comment") filter.comment = id;
        if (type === "video") filter.video = id;

        const existingReaction = await Reaction.findOne(filter);

        if (existingReaction) {
            if (existingReaction.reaction === reaction) {
                await Reaction.findByIdAndDelete(existingReaction._id);
            } else {
                existingReaction.reaction = reaction;
                await existingReaction.save();
            }
        } else {
            const newReaction = new Reaction({
                user: userId,
                reaction,
                ...(type === "comment" ? { comment: id } : { video: id })
            });
            await newReaction.save();
        }


        filter = {};
        if (type === "comment") filter.comment = id;
        if (type === "video") filter.video = id;

        const reactions = await Reaction.find(filter);
        const reactionCount = { likes: 0, dislikes: 0 };

        reactions.forEach(reaction => {
            if (reaction.reaction) {
                reactionCount.likes++;
            } else {
                reactionCount.dislikes++;
            }
        });
        return res.json({ message: "Reaction added", reactionCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.put("/video/:id/view", async (req, res) => {
    try {
        const videoId = req.params.id;
        if (!videoId) return res.status(400).json({ message: "Invalid video ID" });

        await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

        res.json({ message: "View count updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.put("/video/:id/complain", authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json('Not registered');

        const id = req.params.id;


        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.put("/video/:id/description", authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json('Not registered');

        const id = req.params.id;
        const text = req.body.text;

        await Video.findByIdAndUpdate(id, { description: text })

        res.json({ message: 'Description changed successfully' })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error })
    }
})

router.put('/:channel/subscribe', authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Not registered' });

        const login = req.params.channel;

        const user = await User.findOne({ login });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const existingFollowing = await Follower.findOne({ user: user._id, follower: req.user._id });
        if (existingFollowing) {
            await existingFollowing.deleteOne();
            return res.json({ message: 'unsubscribed' });
        }

        await Follower.findOneAndUpdate(
            { user: user._id, follower: req.user._id },
            { user: user._id, follower: req.user._id },
            { upsert: true, new: true }
        );

        return res.json({ message: 'subscribed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});





// DELETES

router.delete('/video/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json('Not registered');

        const { success, message, error } = await deleteVideo(req.user, req.params.id);

        if (!success) {
            return res.status(error ? 500 : 403).json({ success, message, error });
        }

        res.status(200).json({ success, message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error })
    }
})

router.delete('/comment/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json('Not registered');

        const { success, message, error } = await deleteComment(req.user, req.params.id);

        if (!success) {
            return res.status(error ? 500 : 403).json({ success, message, error });
        }

        res.status(200).json({ success, message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error })
    }
})



export default router;