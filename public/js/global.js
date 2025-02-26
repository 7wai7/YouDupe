
async function checkAuth() {
    const response = await fetch('/api/me', { method: 'GET' });
    const message = await response.json();
    console.log(message);
    return response.ok;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}


document.addEventListener("DOMContentLoaded", () => {

    // ДОДАВАННЯ EVENT DELEGATION
    try {
        document.addEventListener("input", function(event) {
            if (event.target.matches(".textarea-autosize")) {
                const textarea = event.target;
                const style = window.getComputedStyle(textarea);
                const lineHeight = parseFloat(style.lineHeight);
        
                textarea.style.height = lineHeight + 'px';
                textarea.style.height = textarea.scrollHeight  + "px";
            }
        });
    } catch (error) {
        console.error(error);
    }

    try {
        document.addEventListener("click", function (event) {
            const dropdown = event.target.closest(".dropdown");

        
            // Якщо клікнули поза dropdown — закриваємо всі
            if (!dropdown) {
                document.querySelectorAll(".dropdown .content").forEach(content => {
                    content.setAttribute("hidden", "");
                });
                return;
            }
        
            const button = dropdown.querySelector("button");
            const content = dropdown.querySelector(".content");

        
            // Якщо клікнули по кнопці — перемикаємо видимість
            if (event.target.closest("button") === button) {
                // Закриваємо всі інші dropdown
                document.querySelectorAll(".dropdown .content").forEach(c => c.setAttribute("hidden", ""));
        
                content.removeAttribute("hidden");

                // Отримати розміри кнопки і меню
                const buttonRect = button.getBoundingClientRect();
                const contentRect = content.getBoundingClientRect();
                const screenWidth = window.innerWidth;
    
                // Якщо меню виходить за правий край, зміщуємо його ліворуч
                if (buttonRect.right + contentRect.width > screenWidth) {
                    content.style.left = "auto";
                    content.style.right = "0";
                } else {
                    content.style.left = "0";
                    content.style.right = "auto";
                }
    
                content.style.width = "max-content";
            }
        });
    } catch (error) {
        console.error(error);
    }


    try {
        document.addEventListener("click", async function (event) {
            const btn = event.target.closest('.like, .dislike');
            if (!btn) return;
        
            const wrapper = btn.closest(".like-dislike-wrapper");
            const isLike = btn.classList.contains("like");
        
            const like = wrapper.querySelector(".like");
            const dislike = wrapper.querySelector(".dislike");
            const likeCountEl = wrapper.querySelector(".like-count");
            const dislikeCountEl = wrapper.querySelector(".dislike-count");
        
            const type = wrapper.classList.contains("reaction-video") ? "video" : "comment";
            const id = type === "video" 
                ? new URLSearchParams(window.location.search).get("v") 
                : wrapper.closest(".comment")?.id;
        
            try {
                const response = await fetch(`/api/${type}/${id}/reaction/${isLike ? "1" : "0"}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" }
                });
        
                if (!response.ok) throw new Error("Failed to update reaction");
        
                const data = await response.json();
        
                if (isLike) {
                    like.toggleAttribute("selected");
                    dislike.removeAttribute("selected");
                } else {
                    dislike.toggleAttribute("selected");
                    like.removeAttribute("selected");
                }
        
                likeCountEl.innerText = data.reactionCount.likes;
                dislikeCountEl.innerText = data.reactionCount.dislikes;
        
            } catch (error) {
                console.error(error);
            }
        });
    } catch (error) {
        console.error(error);
    }

    try {
        document.addEventListener("click", async function (event) {
            
        });
    } catch (error) {
        console.error(error);
    }




    try {
        document.getElementById('logout-btn')?.addEventListener('click', (event) => {
            fetch('api/auth/logout', { method: 'POST' })
            .then(response => {
                if(response.ok) {
                    window.location.href = '/';
                }
            })
            .catch(console.error)
        })
    } catch(error) {
        console.error(error)
    }


    // SEARCH TEXT AREA
    try {
        const searchInput = document.getElementById("search-input");
        const searchBtn = document.querySelector(".search-btn");

        function search() {
            const text = searchInput.value.trim();
            searchInput.value = '';

            if (text === "") return;

            if(window.location.pathname.split('/')[1] === 'studio') {
                window.location.href = `/studio/find/${text}`;
            } else window.location.href = `/find/${text}`;
        }

        // Виконати пошук при кліку на кнопку
        searchBtn?.addEventListener("click", (event) => {
            event.preventDefault();
            search();
        });

        // Виконати пошук при натисканні Enter
        searchInput?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                search();
            }
        });
    } catch (error) {
        console.error(error);
    }



    
    try {
        const subscribeBtn = document.getElementById('subscribe-btn');

        subscribeBtn?.addEventListener('click', (event) => {
            if(subscribeBtn.hasAttribute('subscribed')) {
                subscribeBtn.removeAttribute('subscribed');
                subscribeBtn.innerHTML = 'Subscribe';
            } else {
                subscribeBtn.setAttribute('subscribed', '');
                subscribeBtn.innerHTML = 'Subscribed';
            }

            fetch(`/api/subscribed/${subscribeBtn.hasAttribute('subscribed')}`, { method: 'PUT' })
            .catch(console.error);

        })
        
    } catch (error) {
        console.error(error)
    }

});