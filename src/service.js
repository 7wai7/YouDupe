import User from './models/User.js';
import Video from './models/Video.js';
import Comment from './models/Comment.js';

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
        return { success: false, message: 'Error when deleting a video', error };
    }
}

export async function deleteComment(userId, commentId) {
    try {
        const user = await User.findById(userId);
        if(!user) {
            return { success: false, message: 'User not found' }
        }

        const comment = await Comment.findById(commentId);
        if(!comment) {
            return { success: false, message: 'Comment not found' }
        }

        if(user.role === 'admin' || user.role === 'moderator' || user._id.tpString() === comment.user.toString()) {
            await Comment.findByIdAndDelete(commentId);
            return { success: true, message: 'Comment deleted successfully' }
        }

        return { success: false, message: 'No rights to delete comment' };
    } catch (error) {
        return { success: false, message: 'Error when deleting comment', error };
    }
}


