let currentSongs = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getsongs(folder) {
    currFolder = folder;
    let a = await fetch(`/songs/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songList = [];

    for (let element of as) {
        if (element.href.endsWith(".weba") || element.href.endsWith(".mp3")) {
            songList.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
        }
    }

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (let song of songList) {
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Shahaan</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
    }

    Array.from(songUL.children).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info div").innerText.trim());
        });
    });

    return songList;
}

const playMusic = (track, pause = false) => {
    currentSongs.src = `/songs/${currFolder}/${track}`;
    if (!pause) {
        currentSongs.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerText = track;
    document.querySelector(".songtime").innerText = "00:00";
};

async function displayAlbums() {
    let a = await fetch("/songs/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (let e of anchors) {
        if (e.href.includes("/songs/") && !e.href.endsWith(".weba") && !e.href.endsWith(".mp3")) {
            let folder = e.href.split("/songs/")[1].replace("/", "");
            let title = folder;
            let description = "No description available";

            try {
                let res = await fetch(`/songs/${folder}/info.json`);
                if (res.ok) {
                    let json = await res.json();
                    title = json.title || folder;
                    description = json.description || description;
                }
            } catch (err) {
                console.warn(`info.json missing for ${folder}, using defaults`);
            }

            cardContainer.innerHTML += `
            <div class="card" data-folder="${folder}">
                <div class="play">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M5 20V4L19 12L5 20Z" fill="#000"/>
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.png" onerror="this.src='img/defaultcover.png'" alt="">
                <h2>${title}</h2>
                <p>${description}</p>
            </div>`;
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async () => {
            songs = await getsongs(e.dataset.folder);
            if (songs.length > 0) {
                playMusic(songs[0]);
            } else {
                document.querySelector(".songinfo").innerText = "No songs available in this album";
            }
        });
    });
}


async function main() {
    songs = await getsongs("Electronic");
    playMusic(songs[0], true);
    displayAlbums();

    play.addEventListener("click", () => {
        if (currentSongs.paused) {
            currentSongs.play();
            play.src = "img/pause.svg";
        } else {
            currentSongs.pause();
            play.src = "img/play.svg";
        }
    });

    currentSongs.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = 
            `${secondsToMinutesSeconds(currentSongs.currentTime)} / ${secondsToMinutesSeconds(currentSongs.duration)}`;
        document.querySelector(".circle").style.left = 
            `${(currentSongs.currentTime / currentSongs.duration) * 100}%`;
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = `${percent}%`;
        currentSongs.currentTime = (currentSongs.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        let currentTrack = decodeURIComponent(currentSongs.src.split("/").pop());
        let index = songs.indexOf(currentTrack);
        if (index > 0) playMusic(songs[index - 1]);
    });

    next.addEventListener("click", () => {
        let currentTrack = decodeURIComponent(currentSongs.src.split("/").pop());
        let index = songs.indexOf(currentTrack);
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        } else {
            document.querySelector(".songinfo").innerText = "Playlist End";
        }
    });

    currentSongs.addEventListener("ended", () => {
        let currentTrack = decodeURIComponent(currentSongs.src.split("/").pop());
        let index = songs.indexOf(currentTrack);
        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });

    document.querySelector(".range input").addEventListener("input", e => {
        currentSongs.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentSongs.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentSongs.volume = 1;
            document.querySelector(".range input").value = 100;
        }
    });
}

main();
