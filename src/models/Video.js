import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const videoSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: "User", required: true },
    duration: { type: String, required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 2600 },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    complains: { type: Number, default: 0 },
}, {
    timestamps: true
});

export default mongoose.model('Video', videoSchema);