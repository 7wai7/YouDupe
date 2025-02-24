import Router from 'express';
import fs from "fs";
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import { log } from 'console';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

import { authMiddleware } from '../middlewares/middlewares.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import { Comment } from '../models/Comment.js';
import Reaction from '../models/Reaction.js';

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

router.get('/previews/:id', (req, res) => {
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

router.get("/recommendedVideos/:current_video_id", async (req, res) => {
    const current_video_id = req.params.current_video_id;
    const limit = req.query.limit;
    const offset = req.query.offset;

    let videos = await Video.find();

    if (current_video_id) {
        videos = videos.filter(video => video._id.toString() !== current_video_id);
    }

    res.render('partials/recommendedVideo', { videos, layout: false });
})

router.get("/comments", authMiddleware, async (req, res) => {
    try {
        const videoId = req.query.video;
        let limit = parseInt(req.query.limit) || 10;
        let offset = parseInt(req.query.offset) || 0;
        const sort = req.query.sort || "popular";

        // Опції сортування: "popular" -> за лайками, "newest" -> за датою
        const sortOptions = sort === "popular" ? { likes: -1 } : { createdAt: -1 };

        const comments = await Comment.find({ video: videoId, parentComment: null })
            .populate('user', 'login') // Підвантажуємо лише логін користувача (оптимізація)
            .sort(sortOptions)
            .skip(offset)
            .limit(limit);


        // Отримуємо всі ID коментарів
        const commentIds = comments.map(comment => comment._id);

        const replies = await Comment.find({ parentComment: { $in: commentIds } })
        .distinct("parentComment")

        const replySet = new Set(replies.map(id => id.toString())); // Set для швидкого пошуку

        comments.forEach(comment => {
            comment.hasReply = replySet.has(comment._id.toString());
        });



        const reactions = await Reaction.find({ comment: { $in: commentIds } });

        const reactionCount = {};
        commentIds.forEach(id => reactionCount[id] = { likes: 0, dislikes: 0 });

        reactions.forEach(reaction => {
            if (reaction.reaction) {
                reactionCount[reaction.comment].likes++;
            } else {
                reactionCount[reaction.comment].dislikes++;
            }
        });

        const userId = req.user?._id;

        // Об'єкт для збереження реакцій користувача
        const userReactions = {};
        if (userId) {
            reactions.forEach(reaction => {
                if (reaction.user.toString() === userId.toString()) {
                    userReactions[reaction.comment] = reaction.reaction; // true (like) / false (dislike)
                }
            });
        }

        res.render('partials/comment', {
            comments,
            setParentComment: true,
            reactionCount,
            userReactions,
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
        const videoId = req.query.video;
        const commentId = req.query.comment;
        let limit = parseInt(req.query.limit) || 10;
        let offset = parseInt(req.query.offset) || 0;


        const comments = await Comment.find({ video: videoId, parentComment: commentId })
            .populate('user', 'login')
            .sort({ createdAt: 1 })
            .skip(offset)
            .limit(limit);



        const commentIds = comments.map(comment => comment._id);
        const reactions = await Reaction.find({ comment: { $in: commentIds } });

        const reactionCount = {};
        commentIds.forEach(id => reactionCount[id] = { likes: 0, dislikes: 0 });

        reactions.forEach(reaction => {
            if (reaction.reaction) {
                reactionCount[reaction.comment].likes++;
            } else {
                reactionCount[reaction.comment].dislikes++;
            }
        });

        const userId = req.user?._id;

        // Об'єкт для збереження реакцій користувача
        const userReactions = {};
        if (userId) {
            reactions.forEach(reaction => {
                if (reaction.user.toString() === userId.toString()) {
                    userReactions[reaction.comment] = reaction.reaction; // true (like) / false (dislike)
                }
            });
        }

        res.render('partials/comment', {
            comments,
            setParentComment: false,
            reactionCount,
            userReactions,
            formatDistanceToNow,
            uk,
            layout: false
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})

router.get("/studio/load", (req, res) => {
    const filter = req.query.filter || "date";
    const sort = req.query.sort || "down";

    log(filter + ", " + sort);

    res.json({ message: 'success' });
});

router.get("/channel/:login/load", async (req, res) => {
    try {
        const userLogin = req.params.login;
        const sort = req.query.sort || "newer";

        const userChannel = await User.findOne({ login: userLogin });
        if (!userChannel) return res.status(404).render('partials/channelVideo', { videos: [], layout: false });

        const sortOptions = sort === "popular" ? { likes: -1 } : { createdAt: -1 };
        const videos = await Video.find({ user: userChannel._id }).sort(sortOptions);

        res.render('partials/channelVideo', {
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

/* router.post("/studio/upload", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Файл не надіслано" });

    const inputPath = req.file.path;
    const date = Date.now();
    const resolutions = {
        '360p': {
            outputDir: path.join(__dirname, `../../videos/${date}/360p`),
            output: "360p.m3u8",
            outputOptions: [
                '-profile:v baseline',
                '-level 3.0',
                '-s 640x360',
                '-b:v 500k',
                '-bufsize 1000k',
                '-b:a 96k',
                '-crf 28',
                '-preset slower',
                '-f hls',
                '-hls_time 4',
                '-hls_playlist_type vod'
            ]
        },
        '720p': {
            outputDir: path.join(__dirname, `../../videos/${date}/720p`),
            output: "720p.m3u8",
            outputOptions: [
                '-profile:v baseline',
                '-level 3.0',
                '-s 1280x720',
                '-b:v 1000k',
                '-bufsize 2000k',
                '-b:a 128k',
                '-crf 25',
                '-preset slower',
                '-f hls',
                '-hls_time 4',
                '-hls_playlist_type vod'
            ]
        },
        '1080p': {
            outputDir: path.join(__dirname, `../../videos/${date}/1080p`),
            output: "1080p.m3u8",
            outputOptions: [
                '-profile:v high',
                '-level 4.0',
                '-s 1920x1080',
                '-b:v 2000k',
                '-bufsize 4000k',
                '-b:a 128k',
                '-crf 23',
                '-preset slow',
                '-f hls',
                '-hls_time 4',
                '-hls_playlist_type vod'
            ]
        }
    };

    const tasks = Object.keys(resolutions).map(key => {
        const value = resolutions[key];

        fs.mkdirSync(value.outputDir, { recursive: true });

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .output(path.join(value.outputDir, value.output))
                .videoCodec("libx264")
                .audioCodec("aac")
                .outputOptions(value.outputOptions)
                .on('progress', function(progress) {
                    console.log('Processing: ' + progress.percent + '% done');
                  })
                .on("end", () => {
                    console.log(`Стиснення завершено для ${key}`);
                    resolve();
                })
                .on("error", (err) => {
                    console.error(`Помилка стиснення для ${key}:`, err);
                    reject(err);
                })
                .run();
        });
    });

    Promise.all(tasks)
        .then(() => {
            console.log("Всі формати стиснені.");
            res.json({ message: "Відео стиснене", folder: `/videos/${date}` });
        })
        .catch((err) => {
            console.error("Помилка стиснення:", err);
            res.status(500).json({ error: "Помилка при стисненні відео" });
        });
}); */

/* router.post("/studio/upload", upload.single('video'), async (req, res, next) => {
    try {
        // Створюємо новий документ в базі (ID буде одразу доступним)
        const video = new Video({});
        req.videoId = video._id.toString(); // Зберігаємо ID для використання в Multer

        const videoPath = req.file.path;
        const outputFilePath = `compressed_${req.videoId}.mp4`;

        ffmpeg(videoPath)
            .output(path.join(__dirname, '../../videos', outputFilePath))
            .videoCodec('libx264')
            .size('50%')
            .on('end', async () => {
                console.log('Compression completed!');

                video.duration = req.body.duration;
                video.title = req.body.title || "Untitled";
                video.description = req.body.description || "";

                await video.save();

                console.log('Відео успішно завантажене');
                res.json({ message: "Відео успішно завантажене", video });
            })
            .on('error', (err) => {
                console.error('Compression failed:', err);
                res.status(500).json({ error: 'Compression failed:' + err });
            })
            .run();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при завантаженні відео" });
    }
}); */

router.post("/studio/upload", authMiddleware, async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not registered' });

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

            ffmpeg.ffprobe(path.join(__dirname, `../../${req.files.video[0].path}`), async function (err, metadata) {
                if (err) {
                    console.error("Error retrieving metadata:", err);
                    return res.status(500).json({ error: "Unable to retrieve video information" });
                }

                // Зберігаємо інформацію про відео в базу
                video.user = req.user._id;
                video.duration = metadata.format.duration;
                video.title = req.body.title || "Untitled";
                video.description = req.body.description || "";

                await video.save();

                res.json({ message: "Video has been successfully uploaded", video });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.post("/comment", authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not registered' });

        const videoId = req.query.video;
        const text = req.body.text;

        console.log('comment');
        console.log('videoId', videoId);
        console.log('text', text);

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
        if (!req.user) return res.status(401).json({ message: 'Not registered' });
        
        const videoId = req.query.video;
        const parentCommentId = req.query.parentComment;
        const text = req.body.text;

        console.log('reply');
        console.log('parentCommentId', parentCommentId);
        console.log('text', text);

        const comment = new Comment({
            user: req.user,
            video: videoId,
            parentComment: parentCommentId,
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
        if (!req.user) return res.status(401).json({ message: 'Not registered' });

        const userId = req.user._id;
        const { type, id } = req.params;
        const reaction = Boolean(parseInt(req.params.reaction));

        if (type !== "comment" && type !== "video") {
            return res.status(400).json({ message: "Invalid reaction type" });
        }


        const filter = { user: userId };
        if (type === "comment") filter.comment = id;
        if (type === "video") filter.video = id;

        const existingReaction = await Reaction.findOne(filter);

        if (existingReaction) {
            if (existingReaction.reaction === reaction) {
                await Reaction.findByIdAndDelete(existingReaction._id);
                return res.json({ message: "Reaction removed", reaction: null });
            } else {
                existingReaction.reaction = reaction;
                await existingReaction.save();
                return res.json({ message: "Reaction updated", reaction });
            }
        } else {
            const newReaction = new Reaction({
                user: userId,
                reaction,
                ...(type === "comment" ? { comment: id } : { video: id })
            });
            await newReaction.save();
            return res.json({ message: "Reaction added", reaction: newReaction.reaction });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
})




export default router;