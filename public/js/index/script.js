let isFetching = false;

function loadVideos() {
    if (isFetching) return;
    isFetching = true;

    const container = document.getElementById('content-container');

    fetch(`/api/index/videos`, { method: 'GET' })
        .then(response => response.text())
        .then(htmlText => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;

            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            container.appendChild(fragment);
            tempDiv.remove();
            isFetching = false;
        })
        .catch(console.error);
}

document.addEventListener("DOMContentLoaded", () => {

    try {
        /* window.addEventListener('scroll', () => {
            if (isFetching) return;
        
            const container = document.getElementById('content-container');
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollPosition = window.innerHeight + window.scrollY;

            if (rect.bottom - 100 <= scrollPosition) {
                loadVideos();
            }
        }); */

        loadVideos();
    } catch (error) {
        console.error(error);
    }

});