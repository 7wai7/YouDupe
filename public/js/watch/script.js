
function setActionReaction(wrapper) {
    const like = wrapper.querySelector('.like');
    const dislike = wrapper.querySelector('.dislike');

    /* like.addEventListener('click', () => {
        const isLiked = like.hasAttribute('selected');
        like.toggleAttribute('selected', !isLiked);
        dislike.removeAttribute('selected');
    });

    dislike.addEventListener('click', () => {
        const isDisliked = dislike.hasAttribute('selected');
        dislike.toggleAttribute('selected', !isDisliked);
        like.removeAttribute('selected');
    }); */
}

function setActionAddComment(wrapper) {
    const commentArea = wrapper.querySelector(".input-comment-textarea");
    const addCommentBtn = wrapper.querySelector(".add-comment-btn");

    function addComment() {
        const savedText = commentArea.value;
        const text = commentArea.value.trim();
        commentArea.value = '';
        if (text === "") return;

        
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');

        const parentComment = wrapper.closest(".parentComment");
        let url;

        if(parentComment) {
            const parentCommentId = parentComment.id ;
            url = `/comment/reply?video=${videoId}&parentComment=${parentCommentId}`;
        } else {
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

function setCommentActions(container) {
    container.querySelectorAll('.add-comment-wrapper').forEach(setActionAddComment)

    container.querySelectorAll('.reply-btn').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            const wrapper = btn.closest('.comment-data').querySelector('.add-comment-wrapper');
            wrapper.removeAttribute('hidden');

            const commenter = btn.closest('.comment').getAttribute('login');
            btn.closest('.comment-data').querySelector('.input-comment-textarea').value = `${commenter}, `;
        })
    })

    container.querySelectorAll('.cancel-comment-btn').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            const wrapper = btn.closest('.add-comment-wrapper');
            wrapper.setAttribute('hidden', '');
            wrapper.querySelector('.input-comment-textarea').value = '';
        })
    })


    container.querySelectorAll('.like-dislike-wrapper').forEach(wrapper => {
        const type = wrapper.classList.contains('reaction-comment') ? 'comment' : wrapper.classList.contains('reaction-video') ? 'video' : null;
        if(!type) return;

        const like = wrapper.querySelector('.like');
        const dislike = wrapper.querySelector('.dislike');

        like.addEventListener('click', (event) => {
            const id = type === 'comment' ? like.closest('.comment').id : new URLSearchParams(window.location.search).get('v');

            const isLiked = like.hasAttribute('selected');
            like.toggleAttribute('selected', !isLiked);
            dislike.removeAttribute('selected');

            fetch(`/api/${type}/${id}/reaction/1`, {
                method: 'PUT',
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            })
            .catch(console.error);
        });
    
        dislike.addEventListener('click', (event) => {
            const id = type === 'comment' ? dislike.closest('.comment').id : new URLSearchParams(window.location.search).get('v');

            const isDisliked = dislike.hasAttribute('selected');
            dislike.toggleAttribute('selected', !isDisliked);
            like.removeAttribute('selected');
            
            fetch(`/api/${type}/${id}/reaction/0`, {
                method: 'PUT',
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            })
            .catch(console.error);
        });
    });

    container.querySelectorAll(".textarea-autosize").forEach(setActionAutosizeTextarea);
    container.querySelectorAll('.dropdown').forEach(setActionDropdown);
}

function loadReplies(container) {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');

    const commentId = container.closest('.parentComment').id;
    const offset = container.children.length;

    fetch(`/api/comments/replies?video=${videoId}&comment=${commentId}&limit=10&offset=${offset}`, { method: 'GET' })
    .then(response => response.text())
    .then(htmlText => {
        // Створюємо тимчасовий контейнер для перетворення рядка в HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;

        setCommentActions(tempDiv);
        
        // Додаємо всі отримані елементи в DOM
        while (tempDiv.firstChild) {
            container.appendChild(tempDiv.firstChild);
        }

        tempDiv.remove();
    })
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


        setCommentActions(tempDiv);
        
        tempDiv.querySelectorAll('.show-answers-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const wrapper = btn.closest('.comment').querySelector('.answers-wrapper');
                const container = wrapper.querySelector('.answers-container');
    
               if(wrapper.hasAttribute('hidden')) {
                    wrapper.removeAttribute('hidden');
    
                    loadReplies(container);
                } else {
                    wrapper.setAttribute('hidden', '')
                }
            })
        })

        tempDiv.querySelectorAll('.load-other-answers-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const wrapper = btn.closest('.comment').querySelector('.answers-wrapper');
                const container = wrapper.querySelector('.answers-container');
                
                loadReplies(container);
            })
        })

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


    
    try {


    } catch (error) {
        console.error(error);
    }
});