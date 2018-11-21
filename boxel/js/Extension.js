(function (window) {
    //show options overlay for chrome extension release
    if (chrome.extension.ViewType.TAB == "tab" && window.location.href.indexOf("fullscreen") == -1){
        document.getElementById("id-options").style.display = "block";
        //check local storage and update checkbox state
        function updateAudioButton(){
            //if the volume key exists, update checkbox state
            if (localStorage.getItem("volume") != null){
                var audioCheckbox = document.getElementById("id-audio");
                var volume = localStorage.getItem("volume");
                if (volume == 0) audioCheckbox.checked = false;
                else audioCheckbox.checked = true;
            }
            else {
                //start the game muted for first time players
                localStorage.setItem("volume", 0);
                updateAudioButton();
            }
        }
        function toggleVolume(){
            var volume = localStorage.getItem("volume");
            localStorage.setItem("volume", volume != 0 ? 0 : 1);
            window.Game.syncLocalVolume();
        }
        function hideOptions(){
            document.getElementById("id-options").style.display = "none";
        }
        function updateFullscreenButton(){
            //if the fullscreen key exists, update checkbox state
            if (localStorage.getItem("fullscreen") != null){
                var fullscreenCheckbox = document.getElementById("id-fullscreen");
                var fullscreen = localStorage.getItem("fullscreen");
                if (fullscreen == 0) fullscreenCheckbox.checked = false;
                else fullscreenCheckbox.checked = true;
            }
            else {
                //start the game fullscreen for first time players
                localStorage.setItem("fullscreen", 1);
                updateFullscreenButton();
            }
        }
        function toggleFullscreen(){
            var fullscreen = localStorage.getItem("fullscreen");
            localStorage.setItem("fullscreen", fullscreen != 0 ? 0 : 1);
        }

        //create listeners
        document.getElementById("id-fullscreen").addEventListener("click", function(){ toggleFullscreen(); });
        document.getElementById("id-audio").addEventListener("click", function(){ toggleVolume(); });
        document.getElementById("id-play").addEventListener("click", function(){ 
            hideOptions();
            if (document.getElementById("id-fullscreen").checked == true){
                chrome.tabs.create({ url:'www/index.html?fullscreen=true' });
            }
        });
        document.getElementById("id-social").addEventListener("click", function(){ 
            chrome.tabs.create({ url:'https://chrome.google.com/webstore/detail/boxel-rebound/iginnfkhmmfhlkagcmpgofnjhanpmklb/reviews?hl=en-US' });
        });

        //update checkboxes onload
        updateAudioButton();
        updateFullscreenButton();
    }
}(window));