

document.addEventListener("DOMContentLoaded", () => {
    const playerContainer = document.getElementById('player-container');
    const controls = document.querySelector('.controls');
    const playerModal = document.getElementById('player-modal');
    const videoContainer = document.getElementById("video-container");
    const video = document.getElementById("custom-video");
    let timeout;


    function resetTimeout() {
        clearTimeout(timeout);
        timeout = setTimeout(hideControls, 2000);
    }

    function hideControls() {
        controls.style.visibility = 'hidden';
        playerModal.style.visibility = 'hidden';
        controls.style.opacity = 0;
        playerModal.style.opacity = 0;
        playerContainer.style.cursor = 'none';
    }

    function showControls() {
        controls.style.visibility = 'visible';
        if(isMobile()) playerModal.style.visibility = 'visible';
        controls.style.opacity = 1;
        if(isMobile()) playerModal.style.opacity = 1;
        playerContainer.style.cursor = 'default';

        resetTimeout();
    }

    function playOrPause() {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }

    function updatePlayBtnImg() {
        let img;

        if (video.paused) {
            img = 'pause';
        } else {
            img = 'play';
        }

        fetch(`/img/${img}.svg`)
            .then(response => response.text())
            .then(data => {
                document.getElementById("play-pause").innerHTML = data;
                document.getElementById("play-pause-modal-btn").innerHTML = data;
            })
            .catch(console.error);
    }
    




    // ++++++ VIDEO BUTTONS ++++++

    try {

        if (!isMobile()) {
            videoContainer.addEventListener("click", playOrPause);
        }
        document.getElementById("play-pause").addEventListener("click", playOrPause);
        document.getElementById("play-pause-modal-btn").addEventListener("click", playOrPause);



        video.addEventListener("play", updatePlayBtnImg);
        video.addEventListener("pause", updatePlayBtnImg);



        const soundBtn = document.getElementById("sound");
        const soundSlider = document.getElementById("sound-slider");
        let savedSound = 0;

        function updateSoundBtnImg() {
            const v = video.volume;
            soundSlider.value = v;
            let img;

            if (v === 0) {
                img = 'sound-unavailable';
            } else if (v < .5) {
                img = 'sound-low';
            } else {
                img = 'sound';
            }

            fetch(`/img/${img}.svg`)
                .then(response => response.text())
                .then(data => {
                    soundBtn.innerHTML = data;
                })
                .catch(console.error);
        }

        soundSlider.addEventListener("input", (event) => {
            const v = Number(soundSlider.value);
            video.volume = v;

            updateSoundBtnImg();
            resetTimeout();
        });

        soundBtn.addEventListener('click', (event) => {
            const v = Number(soundSlider.value);

            if (v === 0) {
                soundSlider.value = savedSound;
            } else {
                savedSound = v;
                soundSlider.value = 0;
            }

            video.volume = Number(soundSlider.value);
            updateSoundBtnImg();
            resetTimeout();
        });




        videoContainer.addEventListener("keydown", (event) => {
            switch (event.key) {
                case " ": // Пауза/відтворення
                    event.preventDefault(); // Щоб не прокручувалась сторінка
                    video.paused ? video.play() : video.pause();
                    break;

                case "ArrowRight": // → Перемотка вперед
                    video.currentTime += 5;
                    break;

                case "ArrowLeft": // ← Перемотка назад
                    video.currentTime -= 5;
                    break;

                case "ArrowUp": // ↑ Збільшення гучності
                    video.volume = Math.min(video.volume + 0.1, 1);
                    break;

                case "ArrowDown": // ↓ Зменшення гучності
                    video.volume = Math.max(video.volume - 0.1, 0);
                    break;
            }

            updateSoundBtnImg();
            showControls();
        });

        // Автофокус при кліку на контейнер
        videoContainer.addEventListener("click", () => videoContainer.focus());
        videoContainer.focus();
    } catch (error) {
        console.error(error);
    }



    // ++++++ VIDEO SLIDER ++++++
    try {
        const videoSlider = document.getElementById("video-slider");

        const timeCurrent = document.getElementById('time-current');
        const timeDuration = document.getElementById('time-duration')

        function initializeVideo() {
            if (video.readyState >= 1) { // Перевіряємо, чи мета-дані вже завантажені
                videoSlider.max = video.duration;
                timeDuration.innerHTML = formatTime(video.duration);
                video.play();
                console.log("Video metadata loaded");
            } else {
                console.log("Metadata not ready, waiting...");
                video.addEventListener("loadedmetadata", initializeVideo, { once: true });
            }
        }

        initializeVideo();

        video.addEventListener("canplay", () => {
            if (!videoSlider.max) {
                videoSlider.max = video.duration;
                timeDuration.innerHTML = formatTime(video.duration);
            }
        });

        // Оновлює повзунок під час відтворення відео
        video.addEventListener("timeupdate", () => {
            videoSlider.value = video.currentTime;
            timeCurrent.innerHTML = formatTime(video.currentTime);
        });

        // Змінює час відтворення при русі повзунка
        videoSlider.addEventListener("input", () => {
            video.currentTime = videoSlider.value;
            resetTimeout();
        });
    } catch (error) {
        console.error(error);
    }



    // ++++++ FULL SCREEN ++++++
    try {
        const fullScreenBtn = document.getElementById("full-screen");

        function fullScreen() {
            resetTimeout();
            let img;

            if (!document.fullscreenElement) {
                playerContainer.requestFullscreen();
                img = 'full-screen-exit';
                video.classList.remove('limit-height');
            } else {
                document.exitFullscreen();
                img = 'full-screen';
                video.classList.add('limit-height');
            }

            fetch(`/img/${img}.svg`)
                .then(response => response.text())
                .then(data => {
                    fullScreenBtn.innerHTML = data;
                })
                .catch(console.error);
        }

        fullScreenBtn.addEventListener('click', fullScreen);
        videoContainer.addEventListener("dblclick", fullScreen);
    } catch (error) {
        console.error(error);
    }


    try {
        playerContainer.addEventListener('mousemove', showControls);
        playerContainer.addEventListener('mouseleave', hideControls);
        resetTimeout();
    } catch (error) {
        console.error(error);
    }


});
