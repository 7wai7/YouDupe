let isFetching = false;
let hasMoreVideos = true;


function loadVideos() {
    if (isFetching || !hasMoreVideos) return;
    isFetching = true;


    const match = window.location.pathname.match(/^\/channel\/([^\/]+)/);
    const login = match ? match[1] : null;
    
    const container = document.getElementById('content');
    const sort = document.getElementById('content-top-row').dataset.sort;
    const offset = container.querySelectorAll('.video').length;

    fetch(`/api/channel/${login}/videos?sort=${sort}&offset=${offset}`, { method: 'GET' })
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
        const contentTopRow = document.getElementById('content-top-row');
        
        contentTopRow.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                if(!btn.hasAttribute('active')) {
                    contentTopRow.querySelector('button[active]').removeAttribute('active');
                    btn.setAttribute('active', '');

                    document.getElementById('content-top-row').dataset.sort = btn.getAttribute('sort')
                    document.getElementById('content').innerHTML = '';
                    loadVideos();
                }
            })
        });

        loadVideos();
    } catch (error) {
        console.error(error)
    }


    try {
        window.addEventListener('scroll', () => {
            if (isFetching) return;
        
            const container = document.getElementById('content-container');
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollPosition = window.innerHeight + window.scrollY;

            if (rect.bottom - 100 <= scrollPosition) {
                loadVideos();
            }
        });
    } catch (error) {
        console.error(error);
    }

    
});