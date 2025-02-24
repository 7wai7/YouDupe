document.addEventListener("DOMContentLoaded", () => {

    function loadVideos(sort) {
        const match = window.location.pathname.match(/^\/channel\/([^\/]+)/);
        const login = match ? match[1] : null;
    
        fetch(`/api/channel/${login}/load?sort=${sort}`, { method: 'GET' })
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
        })
        .catch(console.error);
    }

    loadVideos('newer');

    try {
        const contentTopRow = document.getElementById('content-top-row');
        
        contentTopRow.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                if(!btn.hasAttribute('active')) {
                    contentTopRow.querySelector('button[active]').removeAttribute('active');
                    btn.setAttribute('active', '');

                    const sort = btn.getAttribute('sort');
                    loadVideos(sort);
                }
            })
        })
    } catch (error) {
        console.error(error)
    }



    try {

    } catch(error) {
        console.log(error)
    }
    
    
});