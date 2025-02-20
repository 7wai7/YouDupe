import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const videoSchema = new mongoose.Schema({
    /* user: { type: ObjectId, ref: "User", required: true }, */
    title: { type: String, required: true, maxlength: 100 },
    /* filename: { type: String, required: true }, */  // Назва файлу на сервері
    /* path: { type: String, required: true }, */  // Шлях до відео
    description: { type: String, maxlength: 2600 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
}, {
    timestamps: true
});

export default mongoose.model('Video', videoSchema);