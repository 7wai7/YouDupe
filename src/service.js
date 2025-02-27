import { User } from './models/User.js';
import Video from './models/Video.js';
import Comment from './models/Comment.js';
import Reaction from './models/Reaction.js';

export async function changeRole(moderatorId, userId, newRole) {
    try {
        const moderator = await User.findById(moderatorId);
        if(!moderator) {
            return { success: false, message: 'Moderator not found' }
        }

        const user = await User.findById(userId);
        if(!user) {
            return { success: false, message: 'User not found' }
        }

        if (moderator.role === 'admin' && user.role !== 'admin') {
            if (['user', 'moderator'].includes(newRole)) {
                user.role = newRole;
                await user.save();
                return { success: true, message: `Role changed to ${newRole}` };
            }
        }

        return { success: false, message: 'No rights to change role' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error when changing the role', error };
    }
};

export async function deleteAccount(moderatorId, userId) {
    try {
        const moderator = await User.findById(moderatorId);
        if(!moderator) {
            return { success: false, message: 'Moderator not found' }
        }

        if (moderator.role !== 'admin') {
            return { success: false, message: 'No rights to delete account' };
        }

        const user = await User.findById(userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        await Comment.deleteMany({ user: userId });
        await Video.deleteMany({ user: userId });
        await User.findByIdAndDelete(userId);

        return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error when deleting an account', error };
    }
};

export async function deleteVideo(userId, videoId) {
    try {
        const user = await User.findById(userId);
        if(!user) {
            return { success: false, message: 'User not found' }
        }

        const video = await Video.findById(videoId);
        if(!video) {
            return { success: false, message: 'Video not found' };
        }

        if(user.role === 'admin' || user.role === 'moderator' || user._id.toString() === video.user.toString()) {
            await Comment.deleteMany({ video: videoId });
            await Video.findByIdAndDelete(videoId);
            return { success: true, message: 'Video deleted successfully' };
        }

        return { success: false, message: 'No rights to delete video' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error when deleting a video', error };
    }
}

export async function deleteComment(user, commentId) {
    try {
        const comment = await Comment.findById(commentId);
        if(!comment) {
            return { success: false, message: 'Comment not found' }
        }

        const canDelete = user.role === 'admin' || user.role === 'moderator' || user._id.tpString() === comment.user.toString();
        if(!canDelete) return { success: false, message: 'No rights to delete comment' }


        // Знаходимо всі дочірні коментарі (ID)
        const childComments = await Comment.find({ parentComment: commentId }).select('_id');
        const childCommentIds = childComments.map(comment => comment._id);

        // Видаляємо всі реакції, пов'язані з цими коментарями включаючи головний
        await Reaction.deleteMany({ comment: { $in: [commentId, ...childCommentIds] } });

        // Видаляємо всі дочірні коментарі
        await Comment.deleteMany({ parentComment: commentId });

        // Видаляємо головний коментар
        await Comment.findByIdAndDelete(commentId);

        return { success: true, message: 'Comment deleted successfully' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error when deleting comment', error: error.message };
    }
}



export function getReactionsCount(commentIds, reactions) {
    const reactionCount = {};
    commentIds.forEach(id => reactionCount[id] = { likes: 0, dislikes: 0 });

    reactions.forEach(reaction => {
        if (reaction.reaction) {
            reactionCount[reaction.comment].likes++;
        } else {
            reactionCount[reaction.comment].dislikes++;
        }
    });

    return reactionCount;
}

export function getUserReactions(req, reactions) {
    const userId = req.user?._id;
    // Об'єкт для збереження реакцій користувача
    const userReactions = {};
    if (userId) {
        reactions.forEach(reaction => {
            if (reaction.user.toString() === userId.toString()) {
                userReactions[reaction.comment] = reaction.reaction; // true (like) / false (dislike)
            }
        });
    }

    return userReactions;
}