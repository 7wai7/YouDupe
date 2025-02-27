document.addEventListener("DOMContentLoaded", () => {

    function loadVideos(sort) {
        const match = window.location.pathname.match(/^\/channel\/([^\/]+)/);
        const login = match ? match[1] : null;
        
        const container = document.getElementById('content');
        const offset = container.querySelectorAll('.video').length;
    
        fetch(`/api/channel/${login}/load?sort=${sort}&offset=${offset}`, { method: 'GET' })
        .then(response => response.text())
        .then(htmlText => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;

            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            content.appendChild(fragment);
            tempDiv.remove();
        })
        .catch(console.error);
    }

    try {
        const contentTopRow = document.getElementById('content-top-row');
        
        contentTopRow.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                if(!btn.hasAttribute('active')) {
                    contentTopRow.querySelector('button[active]').removeAttribute('active');
                    btn.setAttribute('active', '');

                    const sort = btn.getAttribute('sort');
                    document.getElementById('content').innerHTML = '';
                    loadVideos(sort);
                }
            })
        });

        loadVideos('newer');
    } catch (error) {
        console.error(error)
    }



    try {

    } catch(error) {
        console.log(error)
    }
    
    
});