import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const userLikedVideosSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: "User", required: true },
    video: { type: ObjectId, ref: "Video", required: true }
}, {
    timestamps: true
});

async function toggleLike(userId, videoId) {
    const existingLike = await UserLikedVideos.findOne({ user: userId, video: videoId });

    if (existingLike) {
        await UserLikedVideos.deleteOne({ _id: existingLike._id }); // Прибираємо лайк
        return { message: "Лайк видалено" };
    } else {
        await new UserLikedVideos({ user: userId, video: videoId }).save(); // Додаємо лайк
        return { message: "Лайк додано" };
    }
}


export default mongoose.model('UserLikedVideos', userLikedVideos);