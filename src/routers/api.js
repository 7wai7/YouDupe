import Router from 'express';
import fs from "fs";
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import { log } from 'console';
import Video from '../models/Video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


/* const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'videos/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
        cb(null, uniqueName);
    }
}); */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, 'videos/'); // Папка для відео
        } else if (file.fieldname === 'preview') {
            cb(null, 'previews/'); // Папка для прев’ю
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.videoId}${ext}`);
    }
});

const upload = multer({ storage });


const router = new Router();


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


router.get("/studio/upload", (req, res) => {
    const filter = req.query.filter || "date";
    const sort = req.query.sort || "down";

    log(filter + ", " + sort);

    res.json({ message: 'success' });
});

// Ендпоінт для завантаження відео
/* router.post('/studio/upload', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не завантажено' });
    }

    try {
        const video = new Video({
            title: req.body.title || 'Без назви',
            filename: req.file.filename,
            path: `/videos/${req.file.filename}`,
            user: req.user._id // ID користувача (можна взяти з сесії або JWT)
        });

        await video.save();

        res.json({ message: 'Відео завантажене', video });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка при збереженні відео' });
    }
}); */


router.post("/studio/upload", async (req, res, next) => {
    try {
        // Створюємо новий документ в базі (ID буде одразу доступним)
        const video = new Video({});
        req.videoId = video._id.toString(); // Зберігаємо ID для використання в Multer

        // Виконуємо Multer для завантаження файлів
        upload.fields([
            { name: "video", maxCount: 1 },
            { name: "preview", maxCount: 1 }
        ])(req, res, async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Помилка при завантаженні файлів" });
            }
            
            if (!req.files || !req.files.video) {
                return res.status(400).json({ error: "Відео не завантажено" });
            }

            // Зберігаємо інформацію про відео в базу
            video.title = req.body.title || "Untitled";
            video.description = req.body.description || "";

            await video.save();

            res.json({ message: "Відео успішно завантажене", video });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при збереженні відео" });
    }
});




export default router;