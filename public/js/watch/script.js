
document.addEventListener("DOMContentLoaded", () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const currentVideoId = urlParams.get('v');

        fetch(`/api/recommendedVideos/${currentVideoId}`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.text())
        .then(data => {
            document.getElementById('video-recommendations').innerHTML = data;
        })
        .catch(console.error)
    } catch (error) {
        console.error(error);
    }
});