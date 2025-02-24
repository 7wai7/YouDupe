import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const commentSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: "User", required: true },
    video: { type: ObjectId, ref: "Video", required: true },
    parentComment: { type: ObjectId, ref: 'Comment', default: null },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    text: { type: String, maxlength: 2600 },
}, {
    timestamps: true
});

// Схема для відповідей (наслідує основну схему)
/* const replySchema = new mongoose.Schema({
    parentComment: { type: ObjectId, ref: "Comment", required: true }, 
    ...commentSchema.obj, 
}, {
    timestamps: true
}); */

export const Comment = mongoose.model('Comment', commentSchema);
/* export const Reply = mongoose.model('Reply', replySchema); */