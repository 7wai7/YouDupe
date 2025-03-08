function isMobile() {
    return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

async function checkAuth() {
    const response = await fetch('/api/me', { method: 'GET', credentials: 'include' });
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
        function calculateDropdownRect(button, content) {
            const buttonRect = button.getBoundingClientRect();
            const contentRect = content.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            const screeHeight = window.innerHeight;

            // Якщо меню виходить за правий край, зміщуємо його ліворуч
            if (buttonRect.right + contentRect.width > screenWidth) {
                content.style.left = "auto";
                content.style.right = "0";
            } else {
                content.style.left = "0";
                content.style.right = "auto";
            }

            if (buttonRect.bottom + contentRect.height > screeHeight) {
                content.style.top = "auto";
                content.style.bottom = buttonRect.height + 'px';
            } else {
                content.style.top = buttonRect.height + 'px';
                content.style.bottom = "auto";
            }

            content.style.width = "max-content";
            content.style.height = "max-content";
        }


        document.querySelectorAll(".dropdown .content").forEach(content => {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    const button = content.closest(".dropdown").querySelector("button");

                    calculateDropdownRect(button, content);
                });
            });
            
            observer.observe(content, { childList: true, subtree: true });
        });


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
                calculateDropdownRect(button, content);
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
        document.getElementById('logout-btn')?.addEventListener('click', (event) => {
            fetch('/api/auth/logout', { method: 'POST' })
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
        const hideSearchRowBtn = document.querySelector('.hide-search-row-btn-mobile');
        const searchRow = document.querySelector('.search-row');
        const searchInput = document.getElementById("search-input");
        const searchBtn = document.querySelector(".search-btn");
        const searchBtnMobile = document.querySelector(".search-btn-mobile");
        const sectionRows = document.querySelectorAll('header .section-row');
    
        function resizeHeader() {
            const isMobile = window.innerWidth <= 500;
            searchRow.style.display = isMobile && hideSearchRowBtn.style.display !== 'block' ? 'none' : 'flex';
            searchBtnMobile.style.display = isMobile ? 'block' : 'none';

            if(!isMobile) {
                sectionRows.forEach(section => section.style.display = 'flex');
                hideSearchRowBtn.style.display = 'none';
            }
        }
    
        function showSearchRow() {
            hideSearchRowBtn.style.display = 'block';
            searchRow.style.display = 'flex';
            sectionRows.forEach(section => section.style.display = 'none');
            searchBtnMobile.style.display = 'none';
        }
    
        function hideSearchRow() {
            hideSearchRowBtn.style.display = 'none';
            searchRow.style.display = 'flex';
            sectionRows.forEach(section => section.style.display = 'flex');
            resizeHeader();
        }
    
        function search() {
            const text = searchInput.value.trim();
            if (!text) return;
            searchInput.value = '';
    
            const basePath = window.location.pathname.includes('/studio') ? '/studio/find/' : '/find/';
            window.location.href = basePath + encodeURIComponent(text);
        }
    
        searchBtn?.addEventListener("click", search);
        searchBtnMobile?.addEventListener("click", showSearchRow);
        hideSearchRowBtn?.addEventListener("click", hideSearchRow);
        
        // Виконати пошук при натисканні Enter
        searchInput?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                search();
            }
        });
    
        window.addEventListener('resize', resizeHeader);
        resizeHeader();
    } catch (error) {
        console.error(error);
    }
    



    
    try {
        const subscribeBtn = document.getElementById('subscribe-btn');

        subscribeBtn?.addEventListener('click', async (event) => {
            const { channellogin: login } = subscribeBtn.dataset;
            if(!login) return;

            const response = await fetch(`/api/${login}/subscribe`, { method: 'PUT' });

            if (response.ok) {
                const data = await response.json();
                console.log(data);

                if (data.message === 'subscribed') {
                    subscribeBtn.setAttribute('subscribed', '');
                    subscribeBtn.textContent = 'Subscribed';
                } else if (data.message === 'unsubscribed') {
                    subscribeBtn.removeAttribute('subscribed');
                    subscribeBtn.textContent = 'Subscribe';
                }
            }

        })
    } catch (error) {
        console.error(error)
    }


    
});