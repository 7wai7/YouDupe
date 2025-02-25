
document.addEventListener("DOMContentLoaded", () => {

    try {
        const wrapper = document.querySelector('.like-dislike-wrapper.reaction-video');
        setActionReaction(wrapper, 'video', new URLSearchParams(window.location.search).get('v'));
    } catch (error) {
        console.error(error);
    }






    // SUBSCRIBE
    try {
        const subscribe_btn = document.getElementById('subscribe-btn');

        subscribe_btn.addEventListener('click', (event) => {
            fetch('/subscribe', { method: 'POST' })
                .catch(console.error)

            if (subscribe_btn.classList.contains("not-subscribed"))
                subscribe_btn.classList.remove("not-subscribed");
            else subscribe_btn.classList.add("not-subscribed");
        });
    } catch (error) {
        console.error(error);
    }




    // ++++++ VIDEO BUTTONS ++++++

    try {
        const videoContainer = document.getElementById("video-container");
        const video = document.getElementById("custom-video");
        const playPause = document.getElementById("play-pause");

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
                playPause.innerHTML = data;
            })
            .catch(console.error);
        }

        function playOrPause() {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
            
            updatePlayBtnImg();
        }

        videoContainer.addEventListener("click", playOrPause);
        playPause.addEventListener("click", playOrPause);


        
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

            updatePlayBtnImg();
            updateSoundBtnImg();
        });

        // Автофокус при кліку на контейнер
        videoContainer.addEventListener("click", () => videoContainer.focus());
    } catch (error) {
        console.error(error);
    }



    // ++++++ VIDEO SLIDER ++++++
    try {
        const video = document.getElementById("custom-video");
        const videoSlider = document.getElementById("video-slider");

        const timeCurrent = document.getElementById('time-current');
        const timeDuration = document.getElementById('time-duration')


        function updateTime() {
            timeCurrent.innerHTML = formatTime(video.currentTime);
        }


        video.addEventListener("loadedmetadata", () => {
            videoSlider.max = video.duration;
            timeDuration.innerHTML = formatTime(video.duration);
            video.play();
        });

        // Змінює час відтворення при русі повзунка
        videoSlider.addEventListener("input", () => {
            video.currentTime = videoSlider.value;
        });

        // Оновлює повзунок під час відтворення відео
        video.addEventListener("timeupdate", () => {
            videoSlider.value = video.currentTime;
            updateTime();
        });
    } catch (error) {
        console.error(error);
    }



    // ++++++ FULL SCREEN ++++++
    try {
        const playerContainer = document.getElementById('player-container');
        const videoContainer = document.getElementById('video-container');
        const fullScreenBtn = document.getElementById("full-screen");

        function fullScreen() {
            let img;

            if (!document.fullscreenElement) {
                playerContainer.requestFullscreen();
                img = 'full-screen-exit';
            } else {
                document.exitFullscreen();
                img = 'full-screen';
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
        const playerContainer = document.getElementById('player-container');
        const controls = document.querySelector('.controls');
        let timeout;

        function hideControls() {
            controls.style.display = 'none';
            playerContainer.style.cursor = 'none';
        }

        function showControls() {
            controls.style.display = 'block';
            playerContainer.style.cursor = 'default';

            clearTimeout(timeout);
            timeout = setTimeout(hideControls, 1000); // 1 секунда
        }

        playerContainer.addEventListener('mousemove', showControls);
        playerContainer.addEventListener('mouseleave', hideControls);
    } catch (error) {
        console.error(error);
    }








});
