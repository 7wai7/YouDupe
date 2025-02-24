
function setActionReaction(wrapper) {
    const like = wrapper.querySelector('.like');
    const dislike = wrapper.querySelector('.dislike');

    like.addEventListener('click', () => {
        const isLiked = like.hasAttribute('selected');
        like.toggleAttribute('selected', !isLiked);
        dislike.removeAttribute('selected');
    });

    dislike.addEventListener('click', () => {
        const isDisliked = dislike.hasAttribute('selected');
        dislike.toggleAttribute('selected', !isDisliked);
        like.removeAttribute('selected');
    });
}

function setActionAddComment(wrapper) {
    const commentArea = wrapper.querySelector(".input-comment-textarea");
    const addCommentBtn = wrapper.querySelector(".add-comment-btn");

    function addComment() {
        const savedText = commentArea.value;
        const text = commentArea.value.trim();
        commentArea.value = '';
        if (text === "") return;

        const parentComment = wrapper.closest("comment");
        let url;

        if(parentComment) {
            const parentCommentId = parentComment.id ;
            url = `/comment/reply?parentComment=${parentCommentId}`;
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            const videoId = urlParams.get('v');
            url = `/comment?video=${videoId}`;
        }


        fetch(`/api${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        })
            .then(response => {
                if(response.ok && !wrapper.hasAttribute('notHide')) {
                    wrapper.setAttribute('hidden', '');
                }
            })
            .catch(err => {
                commentArea.value = savedText;
                console.error(err);
            })
    }

    addCommentBtn.addEventListener("click", addComment);

    commentArea.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key === "Enter") {
            addComment();
        }
    });
}

function loadComments() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get('v');

    const offset = document.getElementById('comments-content').children.length;

    fetch(`/api/comments?video=${currentVideoId}&limit=20&offset=${offset}`, { method: 'GET' })
    .then(response => response.text())
    .then(htmlText => {
        const content = document.getElementById('comments-content');
        
        // Створюємо тимчасовий контейнер для перетворення рядка в HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;


        tempDiv.querySelectorAll('.like-dislike-wrapper').forEach(setActionReaction);
        tempDiv.querySelectorAll('.add-comment-wrapper').forEach(setActionAddComment)

        tempDiv.querySelectorAll('.show-answers').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const wrapper = btn.closest('.comment').querySelector('.answers-wrapper');
                wrapper.hasAttribute('hidden') ? wrapper.removeAttribute('hidden') : wrapper.setAttribute('hidden', '');
            })
        })

        tempDiv.querySelectorAll('.reply-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const wrapper = btn.closest('.comment-data').querySelector('.add-comment-wrapper');
                wrapper.removeAttribute('hidden');
            })
        })

        tempDiv.querySelectorAll('.cancel-comment-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const wrapper = btn.closest('.add-comment-wrapper');
                wrapper.setAttribute('hidden', '');
                wrapper.querySelector('.input-comment-textarea').value = '';
            })
        })

        tempDiv.querySelectorAll('.like').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const commentId = btn.closest('.comment').id;

                fetch(`/api/comment/${commentId}/reaction/1`, {
                    method: 'PUT',
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                })
                    .catch(console.error);
            });
        });

        tempDiv.querySelectorAll('.dislike').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const commentId = btn.closest('.comment').id;

                fetch(`/api/comment/${commentId}/reaction/0`, {
                    method: 'PUT',
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                })
                    .catch(console.error);
            });
        });

        tempDiv.querySelectorAll(".textarea-autosize").forEach(setActionAutosizeTextarea);


        // Додаємо всі отримані елементи в DOM
        while (tempDiv.firstChild) {
            content.appendChild(tempDiv.firstChild);
        }

        tempDiv.remove();
    })
    .catch(console.error)
}

document.addEventListener("DOMContentLoaded", () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const currentVideoId = urlParams.get('v');

        fetch(`/api/recommendedVideos/${currentVideoId}`, { method: 'GET' })
        .then(response => response.text())
        .then(htmlText => {
            const container = document.getElementById('video-recommendations');
        
            // Створюємо тимчасовий контейнер для перетворення рядка в HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;


            tempDiv.querySelectorAll('.dropdown').forEach(setActionDropdown);


            // Додаємо всі отримані елементи в DOM
            while (tempDiv.firstChild) {
                container.appendChild(tempDiv.firstChild);
            }

            tempDiv.remove();
        })
        .catch(console.error)
    } catch (error) {
        console.error(error);
    }


    
    try {
        loadComments();
    } catch (error) {
        console.error(error);
    }
});