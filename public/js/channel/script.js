document.addEventListener("DOMContentLoaded", () => {


    try {
        const contentTopRow = document.getElementById('content-top-row');
        
        contentTopRow.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                if(!btn.hasAttribute('active')) {
                    contentTopRow.querySelector('button[active]').removeAttribute('active');
                    btn.setAttribute('active', '');

                    fetch('', { method: 'GET' })
                    .then(response => response.text())
                    .then(html => {
                        document.getElementById('content').innerHTML = html;
                    })
                    .catch(console.error);
                }
            })
        })
    } catch (error) {
        console.error(error)
    }
    
    
});