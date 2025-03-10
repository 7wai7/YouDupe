let isFetching = false; // Чи зараз завантажуються коментарі
let hasMoreComments = true; // Чи є ще коментарі для завантаження
let isFetchingVideos = false;
let hasMoreVideos = true;



async function addComment(commentArea) {
    const wrapper = commentArea.closest(".add-comment-wrapper");
    const savedText = commentArea.value;
    const text = savedText.trim();

    if (!text) return;

    commentArea.value = "";

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");

    const parentComment = wrapper.closest(".parentComment");
    const taggedUser = commentArea.closest('.comment')?.dataset.userid;


    const url = parentComment
        ? `/api/comment/reply?video=${videoId}&parentComment=${parentComment.dataset.id}&taggedUser=${taggedUser}`
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

    const commentId = container.closest('.parentComment').dataset.id;
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

            if (tempDiv.children.length === 0) {
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


    const offset = document.querySelectorAll('.video-recommendations.active-display .video').length;
    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get('v');

    fetch(`/api/watch/recommendedVideos?limit=10&offset=${offset}&current_video=${currentVideoId}`, { method: 'GET' })
        .then(response => response.text())
        .then(htmlText => {
            const container = document.querySelector('.video-recommendations.active-display');

            // Створюємо тимчасовий контейнер для перетворення рядка в HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;

            if (tempDiv.children.length === 0) {
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

function resize() {
    const first = document.querySelector('.video-recommendations.first');
    const second = document.querySelector('.video-recommendations.second');

    if (window.innerWidth < 1120) {
        if (!first.classList.contains('active-display')) {
            second.classList.remove('active-display');
            first.classList.add('active-display');
            first.innerHTML = second.innerHTML;
            second.innerHTML = ''; // Очищаємо, щоб уникнути дублювання
            second.setAttribute('hidden', '');
            first.removeAttribute('hidden');
        }
    } else {
        if (!second.classList.contains('active-display')) {
            first.classList.remove('active-display');
            second.classList.add('active-display');
            second.innerHTML = first.innerHTML;
            first.innerHTML = ''; // Очищаємо, щоб уникнути дублювання
            first.setAttribute('hidden', '');
            second.removeAttribute('hidden');
        }
    }
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

                const commenter = btn.closest('.comment').dataset.login;
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
                const id = deleteCommentBtn.closest('.comment').dataset.id;

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

        document.addEventListener("keydown", function (event) {
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

            const container = document.querySelector('.video-recommendations.active-display');
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollPosition = window.innerHeight + window.scrollY;

            if (rect.bottom - 100 <= scrollPosition) {
                loadVideoRecommendations();
            }
        });

        loadVideoRecommendations();
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



    try {
        resize();
        window.addEventListener('resize', resize);
    } catch (error) {
        console.error(error);
    }



    try {
        const miniPlayer = document.getElementById("mini-player");
        let dragged = false;
        let offsetX = 0, offsetY = 0;

        function onTouchStart(event) {
            dragged = true;
            miniPlayer.classList.add("dragging");

            const touch = event.touches[0];
            offsetX = touch.clientX - miniPlayer.getBoundingClientRect().left;
            offsetY = touch.clientY - miniPlayer.getBoundingClientRect().top;

            document.addEventListener("touchmove", onTouchMove);
            document.addEventListener("touchend", onStopDrag);
        }

        function onTouchMove(event) {
            console.log(event.target);
            
            if (!dragged) return;
            event.preventDefault();

            const touch = event.touches[0];
            let x = touch.clientX - offsetX;
            let y = touch.clientY - offsetY;

            miniPlayer.style.top = `${y}px`;
            miniPlayer.style.left = `${x}px`;
            miniPlayer.style.bottom = "auto";
            miniPlayer.style.right = "auto";
        }

        function onStopDrag() {
            if (!dragged) return;
            dragged = false;

            // Визначаємо розташування відносно найближчого краю
            const rect = miniPlayer.getBoundingClientRect();
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;

            let vertical = rect.top < winHeight - rect.bottom ? "t" : "b";
            let horizontal = rect.left < winWidth - rect.right ? "l" : "r";

            attachToEdge(vertical, horizontal);

            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("touchend", onStopDrag);
        }

        function onDrag(event) {
            if (!dragged) return;

            let x = event.clientX - offsetX;
            let y = event.clientY - offsetY;

            miniPlayer.style.top = `${y}px`;
            miniPlayer.style.left = `${x}px`;
            miniPlayer.style.bottom = "auto";
            miniPlayer.style.right = "auto";
        }

        function attachToEdge(vertical, horizontal) {
            if (vertical === "t") {
                miniPlayer.style.top = "70px";
                miniPlayer.style.bottom = "auto";
            } else if (vertical === "b") {
                miniPlayer.style.bottom = "70px";
                miniPlayer.style.top = "auto";
            }

            if (horizontal === "l") {
                miniPlayer.style.left = "10px";
                miniPlayer.style.right = "auto";
            } else if (horizontal === "r") {
                miniPlayer.style.right = "10px";
                miniPlayer.style.left = "auto";
            }

            miniPlayer.classList.remove("dragging");
        }



        miniPlayer.addEventListener("touchstart", onTouchStart);

        // Якщо потрібно, також можна обробити події для миші:
        miniPlayer.addEventListener("mousedown", (event) => {
            dragged = true;
            miniPlayer.classList.add("dragging");

            // Зберігаємо початкову позицію курсора щодо елемента
            offsetX = event.clientX - miniPlayer.getBoundingClientRect().left;
            offsetY = event.clientY - miniPlayer.getBoundingClientRect().top;

            document.addEventListener("mousemove", onDrag);
            document.addEventListener("mouseup", onStopDrag);
        });



    } catch (error) {
        console.error(error);
    }




    try {
        window.addEventListener('scroll', () => {
            const playerWrapper = document.getElementById('player-wrapper');
            if (!playerWrapper) return;

            const miniPlayer = document.getElementById("mini-player");

            const rect = playerWrapper.getBoundingClientRect();

            if (playerWrapper.querySelector('#player-container') && rect.bottom <= 0) {
                miniPlayer.appendChild(playerWrapper.querySelector('#player-container'));
                miniPlayer.removeAttribute('hidden');
            } else if (miniPlayer.querySelector('#player-container') && rect.bottom >= 0) {
                playerWrapper.appendChild(miniPlayer.querySelector('#player-container'));
                miniPlayer.setAttribute('hidden', '')
            }

        });
    } catch (error) {
        console.error(error);
    }
});