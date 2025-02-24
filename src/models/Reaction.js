import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const reactionSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: "User", required: true },
    comment: { type: ObjectId, ref: "Comment", default: null }, // Реакція до коментаря (опціонально)
    video: { type: ObjectId, ref: "Video", default: null }, // Реакція до відео (опціонально)
    reaction: { type: Boolean, required: true }, // true -> like, false -> dislike
}, { timestamps: true });

// Забезпечуємо, щоб реакція була або до коментаря, або до відео, але не до обох одразу
reactionSchema.index(
    { user: 1, comment: 1, video: 1 },
    { unique: true, partialFilterExpression: { $or: [{ comment: { $ne: null } }, { video: { $ne: null } }] } }
);


export default mongoose.model('Reaction', reactionSchema);
