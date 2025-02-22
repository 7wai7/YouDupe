import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const commentSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: "User", required: true },
    video: { type: ObjectId, ref: "Video", required: true },
    parentComment: { type: ObjectId, ref: "Comment", default: null },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    text: { type: String, maxlength: 2600 },
}, {
    timestamps: true
});

async function getAllRepliesFlatten(commentId) {
    const comments = await Comment.find({}).sort({ createdAt: 1 });

    // Функція для побудови дерева коментарів
    function buildCommentTree(parentId) {
        return comments
            .filter(comment => String(comment.parentComment) === String(parentId))
            .map(comment => ({
                ...comment.toObject(),
                replies: buildCommentTree(comment._id)
            }));
    }

    return buildCommentTree(commentId);
}

export default mongoose.model('Comment', commentSchema);