import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const commentSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: "User", required: true },
    video: { type: ObjectId, ref: "Video", required: true },
    parentComment: { type: ObjectId, ref: 'Comment', default: null },
    taggedUser: { type: ObjectId, ref: 'User', default: null },
    text: { type: String, maxlength: 2600 },
}, {
    timestamps: true
});

export default mongoose.model('Comment', commentSchema);