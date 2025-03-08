
document.addEventListener("DOMContentLoaded", async () => {

    try {
        const container = document.getElementById('content-container');
        const offset = container.querySelectorAll('.video').length;

        const res = await fetch(`/api/history?offset=${offset}`, { method: 'GET' })
        if(res.ok) {
            const htmlText = await res.text();

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;

            const fragment = document.createDocumentFragment();

            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            container.appendChild(fragment);
            tempDiv.remove();
        }
    } catch (error) {
        console.error(error)
    }

});