let isFetching = false; // Чи зараз завантажуються коментарі
let hasMoreComments = true; // Чи є ще коментарі для завантаження
let isFetchingVideos = false;
let hasMoreVideos = true;



async function addComment(commentArea) {
    const wrapper = commentArea.closest(".add-comment-wrapper");
    const savedText = commentArea.value;
    const text = savedText.trim();
    
    if (!text) return;

    commentArea.value = ""; // Очищуємо поле введення

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");

    const parentComment = wrapper.closest(".parentComment");
    const url = parentComment
        ? `/api/comment/reply?video=${videoId}&parentComment=${parentComment.id}`
        : `/api/comment?video=${videoId}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            if (!wrapper.hasAttribute("notHide")) {
                const comment = commentArea.closest(".comment");
                if (comment?.classList.contains("parentComment")) {
                    comment.querySelector(".show-answers-btn")?.removeAttribute("hidden");
                }
                wrapper.setAttribute("hidden", "");
            } else {
                hasMoreComments = true;
                loadComments();
            }
        } else {
            throw new Error("Server error");
        }

        const data = await response.json();
        console.log(data);

    } catch (err) {
        commentArea.value = savedText; // Повертаємо старий текст у разі помилки
        console.error(err);
    }
};


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

            // Додаємо всі отримані елементи в DOM
            while (tempDiv.firstChild) {
                container.appendChild(tempDiv.firstChild);
            }

            tempDiv.remove();
        })
}

function loadComments() {
    if (isFetching || !hasMoreComments) return; // Якщо вже вантажиться або немає більше коментарів - виходимо
    isFetching = true;

    

    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get('v');

    const offset = document.querySelectorAll('#comments-content .comment').length;
    const sort = document.getElementById('toggle-comment-sorting').getAttribute('sort');


    fetch(`/api/comments?video=${currentVideoId}&limit=10&offset=${offset}&sort=${sort}`, { method: 'GET' })
        .then(response => response.text())
        .then(htmlText => {
            const content = document.getElementById('comments-content');

            // Створюємо тимчасовий контейнер для перетворення рядка в HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;
            
            if(tempDiv.children.length === 0) {
                hasMoreComments = false;
                isFetching = false;
                tempDiv.remove();
                return;
            }

            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            content.appendChild(fragment);
            tempDiv.remove();

            isFetching = false;
        })
        .catch(console.error)
}



function loadVideoRecommendations() {
    if (isFetchingVideos || !hasMoreVideos) return; // Якщо вже вантажиться або немає більше коментарів - виходимо
    isFetchingVideos = true;


    const offset = document.querySelectorAll('#video-recommendations .rec-video').length;    
    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get('v');

    fetch(`/api/watch/recommendedVideos?limit=10&offset=${offset}&current_video=${currentVideoId}`, { method: 'GET' })
        .then(response => response.text())
        .then(htmlText => {
            const container = document.getElementById('video-recommendations');

            // Створюємо тимчасовий контейнер для перетворення рядка в HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;
            
            if(tempDiv.children.length === 0) {
                hasMoreVideos = false;
                isFetchingVideos = false;
                tempDiv.remove();
                return;
            }

            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            container.appendChild(fragment);
            tempDiv.remove();
            isFetchingVideos = false;
        })
        .catch(console.error)
}


document.addEventListener("DOMContentLoaded", () => {

    try {
        const video = document.getElementById("custom-video");
        if (!video) return;
    
        const maxWatchTime = 1200; // Максимальний час перегляду (20 хвилин)
        let watchedTime = 0;
        let hasCountedView = false;
        let intervalId = null;
    
        video.addEventListener("play", () => {
            if (intervalId) return; // Запобігаємо створенню кількох інтервалів
    
            intervalId = setInterval(() => {
                if (hasCountedView || video.paused || video.ended /* || document.hidden */) return;
    
                watchedTime += 1;
    
                if (watchedTime >= video.duration * 0.3 || watchedTime >= maxWatchTime) {
                    hasCountedView = true;
                    clearInterval(intervalId); // Зупиняємо лічильник після зарахування перегляду
    
                    fetch(`/api/video/${video.dataset.id}/view`, { method: "PUT" })
                        .then(res => res.json())
                        .then(data => console.log(data.message))
                        .catch(console.error);
                }
            }, 1000);
        });
    
        video.addEventListener("pause", () => { // Зупиняємо таймер на паузі
            clearInterval(intervalId);
            intervalId = null;
        });

        video.addEventListener("ended", () => { // Зупиняємо після завершення відео
            clearInterval(intervalId);
            intervalId = null;
        });
    } catch (error) {
        console.error(error);
    }
    
    
    


    try {
        document.querySelector('.complain-video-btn')?.addEventListener('click', (event) => {
            const videoId = new URLSearchParams(window.location.search).get("v");

            fetch(`/api/video/:${videoId}/complain`, {
                method: "PUT",
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                    return response.json();
                })
                .then(data => console.log(data))
                .catch(console.error);
        })
    } catch (error) {
        console.error(error)
    }


    // ДОДАВАННЯ ОБРОНИКИ ПОДІЙ ДЛЯ КНОПОК КОМЕНТАРІВ ВИКОРИСТОВУЮЧИ EVENT DELEDATION

    try {
        document.getElementById('comments-content').addEventListener('click', (event) => {

            if (event.target.matches('.show-answers-btn')) {
                const btn = event.target;
                const wrapper = btn.closest('.comment').querySelector('.answers-wrapper');
                const container = wrapper.querySelector('.answers-container');

                if (wrapper.hasAttribute('hidden')) {
                    wrapper.removeAttribute('hidden');

                    loadReplies(container);
                } else {
                    wrapper.setAttribute('hidden', '')
                }
            }


            if (event.target.matches('.load-other-answers-btn')) {
                const btn = event.target;
                const wrapper = btn.closest('.comment').querySelector('.answers-wrapper .answers-container');
                loadReplies(wrapper);
            }


            if (event.target.matches('.reply-btn')) {
                const btn = event.target;
                const wrapper = btn.closest('.comment-data').querySelector('.add-comment-wrapper');
                wrapper.removeAttribute('hidden');

                const commenter = btn.closest('.comment').getAttribute('login');
                btn.closest('.comment-data').querySelector('.input-comment-textarea').value = `${commenter}, `;

            }


            if (event.target.matches('.cancel-comment-btn')) {
                const btn = event.target;
                const wrapper = btn.closest('.add-comment-wrapper');
                wrapper.setAttribute('hidden', '');
                wrapper.querySelector('.input-comment-textarea').value = '';
            }


            const deleteCommentBtn = event.target.closest('.delete-comment-btn');
            if (deleteCommentBtn) {
                const id = deleteCommentBtn.closest('.comment').id;

                fetch(`/api/comment/${id}`, { method: 'delete' })
                    .then(response => {
                        if (response.ok) {
                            deleteCommentBtn.closest('.comment').remove();
                        }
                        return response.json();
                    })
                    .then(data => console.log(data))
                    .catch(console.error);
            }

        });
    } catch (error) {
        console.error(error);
    }



    try {
        document.addEventListener("click", async function (event) {
            if (!event.target.matches(".add-comment-btn")) return;

            const btn = event.target;
            const wrapper = btn.closest(".add-comment-wrapper");
            const commentArea = wrapper.querySelector(".input-comment-textarea");
            addComment(commentArea);
        });

        document.addEventListener("keydown", function(event) {
            // Додаємо підтримку `Ctrl + Enter`
            if (!event.target.matches(".input-comment-textarea")) return;

            if (event.ctrlKey && event.key === "Enter") {
                const commentArea = event.target;    
                addComment(commentArea);
            }
        });
    } catch (error) {
        console.error(error);
    }



    try {
        window.addEventListener('scroll', () => {
            if (!hasMoreComments || isFetching) return;
        
            const container = document.getElementById('comments-content');
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollPosition = window.innerHeight + window.scrollY;
            
            if (rect.bottom - 100 <= scrollPosition) {
                loadComments();
            }
        });
    } catch (error) {
        console.error(error);
    }



    try {
        window.addEventListener('scroll', () => {
            if (!hasMoreVideos || isFetchingVideos) return;
        
            const container = document.getElementById('video-recommendations');
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollPosition = window.innerHeight + window.scrollY;

            if (rect.bottom - 100 <= scrollPosition) {
                loadVideoRecommendations();
            }
        });
    } catch (error) {
        console.error(error);
    }



    try {
        document.getElementById('sorting-popular-comments').addEventListener('click', (event) => {
            const toggle = document.getElementById('toggle-comment-sorting');
            if (toggle.getAttribute('sort') === 'popular') return;

            toggle.setAttribute('sort', 'popular');
            document.getElementById('comments-content').innerHTML = '';
            hasMoreComments = true;
            loadComments();
        });
        document.getElementById('sorting-newer-comments').addEventListener('click', (event) => {
            const toggle = document.getElementById('toggle-comment-sorting');
            if (toggle.getAttribute('sort') === 'newer') return;

            toggle.setAttribute('sort', 'newer');
            document.getElementById('comments-content').innerHTML = '';
            hasMoreComments = true;
            loadComments();
        });
    } catch (error) {
        console.error(error);
    }
});