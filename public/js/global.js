
async function checkAuth() {
    const response = await fetch('/api/me', { method: 'GET' });
    return response.ok;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

document.addEventListener("DOMContentLoaded", () => {

    try {
        const actionsList = document.querySelectorAll("a[method]");

        actionsList.forEach((e) => {
            e.addEventListener('click', (event) => {
                event.preventDefault();

                const href = e.getAttribute('href');
                const method = e.getAttribute('method');

                fetch(href, {
                    method,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                })
                    .then(response => {
                        console.log(response);

                    })
                    .catch(console.error);
            });
        });
    } catch (error) {
        console.error(error);
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


    // 

    try {
        const icons = document.querySelectorAll('.icon');

        icons.forEach((icon) => {
            const width = icon.getAttribute('width');
            const height = icon.getAttribute('height');
            icon.style.width = width;
            icon.style.height = height;
            
            function f() {
                const name = icon.getAttribute('name');
                if(!name) return;
                
                fetch(`/img/${name}.svg`)
                .then(response => response.text())  // Завантажуємо SVG як текст
                .then(svgContent => {
                    icon.innerHTML = svgContent;  // Вставляємо SVG в контейнер
                })
                .catch(console.error);
            }

            const observer = new MutationObserver(f);

            observer.observe(icon, {
                attributes: true,  // Спостерігаємо за змінами атрибутів
                attributeFilter: ['name']  // Спостерігаємо тільки за атрибутом 'name'
            });

            f();
        });
    } catch (error) {
        console.error(error);
    }



    try {
        document.querySelectorAll('.dropdown').forEach(function (dropdown) {
            const button = dropdown.querySelector('button');
            const content = dropdown.querySelector('.content');

            button.addEventListener('click', function () {
                content.hasAttribute('hidden') ? content.removeAttribute('hidden') : content.setAttribute('hidden', '');

                // Отримати розміри кнопки і меню
                const buttonRect = button.getBoundingClientRect();
                const contentRect = content.getBoundingClientRect();
                const screenWidth = window.innerWidth;

                // Якщо меню виходить за праву межу екрану, то зміщуємо його ліворуч
                if (buttonRect.right + contentRect.width > screenWidth) {
                    content.style.left = 'auto';
                    content.style.right = '0';
                } else {
                    content.style.left = '0';
                    content.style.right = 'auto';
                }

                content.style.width = 'max-content';
            });

            document.addEventListener('click', function (event) {
                if (!dropdown.contains(event.target)) {
                    content.setAttribute('hidden', '');
                }
            });
        });
    } catch (error) {
        console.error(error);
    }





    
    try {
        document.querySelectorAll(".textarea-autosize").forEach((textarea) => {
            const style = window.getComputedStyle(textarea);
            const lineHeight = parseFloat(style.lineHeight); // Отримуємо висоту одного рядка
            textarea.style.height = lineHeight + "px"; // Встановлюємо висоту під один рядок
            textarea.style.overflowY = "hidden";
        
            textarea.addEventListener("input", function() {
                const style = window.getComputedStyle(this);
                const lineHeight = parseFloat(style.lineHeight);
                this.style.height = lineHeight + "px";

                this.style.height = Math.max(this.scrollHeight, lineHeight) + "px";
            });
        });

        /* inputTextAreaComment.addEventListener("paste", function (event) {
            event.preventDefault();
            const text = (event.clipboardData || window.Clipboard).getData("text");
            document.execCommand("insertText", false, text);
        });

        // Запобігаємо додаванню стилів при введенні
        inputTextAreaComment.addEventListener("input", function () {
            document.execCommand("removeFormat");
        }); */

        
    } catch (error) {
        console.error(error);
    }
    
});