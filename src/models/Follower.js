import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const followerSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: "User", required: true }, // Кого фоловлять
    follower: { type: ObjectId, ref: "User", required: true } // Хто фоловить
}, { timestamps: true });

export default mongoose.model('Follower', followerSchema);
