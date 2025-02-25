
function setActionReaction(wrapper, type, id) {
    const like = wrapper.querySelector('.like');
    const dislike = wrapper.querySelector('.dislike');

    like.addEventListener('click', (event) => {
        fetch(`/api/${type}/${id}/reaction/1`, {
            method: 'PUT',
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })
        .then(response => {
            if(response.ok) {
                const isLiked = like.hasAttribute('selected');
                like.toggleAttribute('selected', !isLiked);
                dislike.removeAttribute('selected');
            }
            return response.json()
        })
        .then(data => {
            like.nextSibling.nextSibling.innerText = data.reactionCount.likes;
            dislike.nextSibling.nextSibling.innerText = data.reactionCount.dislikes;
        })
        .catch(console.error);
    });

    dislike.addEventListener('click', (event) => {
        fetch(`/api/${type}/${id}/reaction/0`, {
            method: 'PUT',
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })
        .then(response => {
            if(response.ok) {
                const isDisliked = dislike.hasAttribute('selected');
                dislike.toggleAttribute('selected', !isDisliked);
                like.removeAttribute('selected');
            }
            return response.json()
        })
        .then(data => {
            like.nextSibling.nextSibling.innerText = data.reactionCount.likes;
            dislike.nextSibling.nextSibling.innerText = data.reactionCount.dislikes;
        })
        .catch(console.error);
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
                if(response.ok) {
                    if(!wrapper.hasAttribute('notHide')) wrapper.setAttribute('hidden', '');
                    else loadComments();
                }
                return response.json();
            })
            .then(data => console.log(data))
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
    container.querySelectorAll('.add-comment-wrapper').forEach(setActionAddComment);

    container.querySelectorAll('.reply-btn').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            const wrapper = btn.closest('.comment-data').querySelector('.add-comment-wrapper');
            wrapper.removeAttribute('hidden');

            const commenter = btn.closest('.comment').getAttribute('login');
            btn.closest('.comment-data').querySelector('.input-comment-textarea').value = `${commenter}, `;

            const comment = btn.closest('.comment');
            if(comment.classList.contains('parentComment')) {
                comment.querySelector('.show-answers-btn').removeAttribute('hidden');
            }
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
        const type = 'comment';
        const id = wrapper.closest('.comment').id;
        setActionReaction(wrapper, type, id);
    });

    container.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            const id = btn.closest('.comment').id;

            fetch(`/api/comment/${id}`, { method: 'delete' })
                .then(response => {
                    console.log(response)
                    if(response.ok) {
                        btn.closest('.comment').remove();
                    }
                    return response.json();
                })
                .then(data => console.log(data))
                .catch(console.error);
        });
    })

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
    document.getElementById('comments-content').innerHTML = '';

    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get('v');

    const offset = document.getElementById('comments-content').children.length;
    const sort = document.getElementById('toggle-comment-sorting').getAttribute('sort');

    fetch(`/api/comments?video=${currentVideoId}&limit=20&offset=${offset}&sort=${sort}`, { method: 'GET' })
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
                const wrapper = btn.closest('.comment').querySelector('.answers-wrapper .answers-container');
                loadReplies(wrapper);
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
        const offset = document.getElementById('video-recommendations').children.length;
        const urlParams = new URLSearchParams(window.location.search);
        const currentVideoId = urlParams.get('v');

        fetch(`/api/recommendedVideos?limit=20&offset=${offset}&current_video=${currentVideoId}`, { method: 'GET' })
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
        document.getElementById('sorting-popular-comments').addEventListener('click', (event) => {
            const toggle =  document.getElementById('toggle-comment-sorting');
            if(toggle.getAttribute('sort') === 'popular') return;

            toggle.setAttribute('sort', 'popular');
            loadComments();
        });
        document.getElementById('sorting-newer-comments').addEventListener('click', (event) => {
            const toggle =  document.getElementById('toggle-comment-sorting');
            if(toggle.getAttribute('sort') === 'newer') return;

            toggle.setAttribute('sort', 'newer');
            loadComments();
        });
    } catch (error) {
        console.error(error);
    }
});