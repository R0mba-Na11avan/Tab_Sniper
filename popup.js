document.addEventListener("DOMContentLoaded", () => {
    const toggleSwitch = document.getElementById("toggleSwitch");
    const urlList = document.getElementById("urlList");
    const urlInput = document.getElementById("urlInput");
    const addUrlBtn = document.getElementById("addUrl");
    const timer = document.getElementById("countdown");
    const timerButton = document.getElementById("timerButton");

    let timerOn = false;
    let timeLeft = 0;

    let isDragging = false;
    let startX = 0;
    let startValue = 0;

    function updateUrlList(urls) {
        urlList.innerHTML = ""; // Clear the list

        urls.forEach(url => {
            let li = document.createElement("li");
            li.textContent = url;

            let removeBtn = document.createElement("button");
            removeBtn.textContent = "❌";
            removeBtn.classList.add("remove-btn");

            removeBtn.addEventListener("click", () => {
                if (timerOn) return;

                let newUrls = urls.filter(u => u !== url);
                chrome.storage.sync.set({ blockedUrls: newUrls }, () => {
                    updateUrlList(newUrls);
                });
            });

            li.appendChild(removeBtn);
            urlList.appendChild(li);
        });
    }

    //if given true, shows the timer, if given false, hides the timer element
    function showTimer(show) {
        if (show) {
            timer.style.display = "inline-flex";
            timerButton.style.display = "inline-flex";
        }
        else {
            timer.style.display = "none";
            timerButton.style.display = "none";
        }
    }

    //function that takes seconds input at converts it based on context to HH:MM:SS or MM:SS in String format
    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600).toString();
        const mins = Math.floor((seconds%3600) / 60).toString();
        const secs = (seconds % 60).toString().padStart(2, "0");
        let output = (hrs != 0) ? (hrs + ":" + mins.padStart(2, "0") + ":" + secs) : (mins + ":" + secs)
        return (output);
    }

    function getTimerTime() {
        if (timer.textContent.split(":").length - 1 == 1){
            const [mins, secs] = timer.textContent.split(":").map(Number);
            return (mins*60 + secs);
        }
        else {
            const [hrs, mins, secs] = timer.textContent.split(":").map(Number);
            return (hrs*3600 + mins*60 + secs);
        }
    }

    function updateTimer() {
        timeLeft--;
        timer.textContent = formatTime(timeLeft);
    }

    // Load saved settings
    chrome.storage.sync.get(["enabled", "blockedUrls"], (data) => {
        toggleSwitch.checked = data.enabled ?? false;
        updateUrlList(data.blockedUrls || []);
        showTimer(toggleSwitch.checked);
    });

    // Toggle the extension on/off
    toggleSwitch.addEventListener("change", () => {
        if (timerOn) return;

        chrome.runtime.sendMessage({ action: "toggle", enabled: toggleSwitch.checked });
        chrome.storage.sync.set({ enabled: toggleSwitch.checked });
        showTimer(toggleSwitch.checked);
    });

    // Add URL to block list
    addUrlBtn.addEventListener("click", () => {
        let url = urlInput.value.trim();
        if (!url) return;

        chrome.storage.sync.get("blockedUrls", (data) => {
            let urls = data.blockedUrls || [];
            if (!urls.includes(url)) {
                urls.push(url);
                chrome.storage.sync.set({ blockedUrls: urls }, () => {
                    updateUrlList(urls);
                });
                urlInput.value = "";
            }
        });
    });

    // checks to see if the user is starting to drag the timer
    timer.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
        //take MM:SS from the timer thingy and convert it to only seconds
        startValue = getTimerTime();
        timer.style.fontSize = "30px";
        document.body.style.userSelect = "none"; //disable text sleection so that the user cna drag freely without selecting everything
    })
    //again check if the user is dragging the timer while the timer element isDragging = true
    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        document.body.style.cursor = "e-resize"
        const dx = e.clientX - startX;
        let delta = dx*10;
        let newTimeValue = Math.max(30, startValue + delta); // Increase right, decrease left
        timer.textContent = formatTime(newTimeValue);
    })

    document.addEventListener("mouseup", () => {
        isDragging = false;
        timer.style.fontSize = "25px";
        document.body.style.cursor = "default"
        document.body.style.userSelect = ""; // Re-enable text selection
    });

    //changes teh color of the button when hovered over
    timerButton.addEventListener("mouseover", () =>{
        timerButton.style.backgroundColor = "#444"
    })
    //changes teh color of the button when the mouse leaves
    timerButton.addEventListener("mouseleave", () =>{
        timerButton.style.backgroundColor = "#333"
    })
});
