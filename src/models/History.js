import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const historySchema = new mongoose.Schema({
    video: { type: ObjectId, ref: "Video", required: true },
    user: { type: ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model('History', historySchema);
