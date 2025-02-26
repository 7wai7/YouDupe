

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

            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            content.appendChild(fragment);
            tempDiv.remove();
        })
        .catch(console.error)
}

document.addEventListener("DOMContentLoaded", () => {
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


            if (event.target.matches('.delete-comment-btn')) {
                const btn = event.target;
                const id = btn.closest('.comment').id;

                fetch(`/api/comment/${id}`, { method: 'delete' })
                    .then(response => {
                        if (response.ok) {
                            btn.closest('.comment').remove();
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
        loadComments();
    } catch (error) {
        console.error(error);
    }



    try {
        document.getElementById('sorting-popular-comments').addEventListener('click', (event) => {
            const toggle = document.getElementById('toggle-comment-sorting');
            if (toggle.getAttribute('sort') === 'popular') return;

            toggle.setAttribute('sort', 'popular');
            document.getElementById('comments-content').innerHTML = '';
            loadComments();
        });
        document.getElementById('sorting-newer-comments').addEventListener('click', (event) => {
            const toggle = document.getElementById('toggle-comment-sorting');
            if (toggle.getAttribute('sort') === 'newer') return;

            toggle.setAttribute('sort', 'newer');
            document.getElementById('comments-content').innerHTML = '';
            loadComments();
        });
    } catch (error) {
        console.error(error);
    }
});