(function (window) {

    //add prototype to window
    window.storageManager = new StorageManager();

	//main prototype
	function StorageManager() {
        //prototype functions
        this.init = function(){
            //initiate object variables
            this.prefix = "br_"; //used for distinguishing local storage
            this.initFirebase();
        };
        this.tick = function (delta) {  };
        this.trimLevel = function(expandedLevel){
            var mapRegex = /<map[^>]*>((.|[\n\r])*)<\/map>/im; //http://stackoverflow.com/a/3642850/2510368
            var tipRegex = /<tip[^>]*>((.|[\n\r])*)<\/tip>/im;
            this.levelString = mapRegex.exec(expandedLevel)[1].trim();
            this.tipString = tipRegex.exec(expandedLevel)[1].trim();
        };
        this.trimLocalLevel = function(key, hasFileOrigin){
            var rawLevelString = "";
            if (hasFileOrigin == true) rawLevelString = window.Game.assetManager.preload.getResult(key+"").toString();
            else rawLevelString = this.getFromLocalStorage(this.prefix+key); //get storage by key
            this.trimLevel(rawLevelString);
        };
        this.expandLevel = function(){
            return "<map>\r\n"+this.levelString+"\r\n</map>\r\n<tip>\r\n"+this.tipString+"\r\n</tip>";
        };
        this.saveToLocalStorage = function(index){
            if (index == null){	index = 1; while (localStorage.getItem(this.prefix + index) !== null){ index++; }}
            localStorage.setItem(this.prefix + index,this.expandLevel());
            return index;
        };
        this.setLevelString = function(levelString){ this.levelString = levelString; };
        this.getFromLocalStorage = function(key){ return localStorage.getItem(key); };
        this.getLocalStorageLength = function(){ return localStorage.length; };
        this.getLocalStorageKey = function(index) { return localStorage.key(index); };
        this.removeFromLocalStorage = function(key){ localStorage.removeItem(this.prefix + key); };
        this.initFirebase = function(){
            // Initialize Firebase
            var config = {
                apiKey: "AIzaSyBo77sWPIHP1iVAxb2djixVa7ckTZAT3J8",
                authDomain: "boxel-rebound.firebaseapp.com",
                databaseURL: "https://boxel-rebound.firebaseio.com",
                storageBucket: "boxel-rebound.appspot.com",
                messagingSenderId: "158486578224"
            };
            firebase.initializeApp(config);
            this.db = firebase.database();
            //localStorage.removeItem("firebase:host:boxel-rebound.firebaseio.com");
        };
        this.saveLevelToFirebase = function(name, levelMap) {
            this.clearFirebaseLocalStorage();
            window.Game.dialog.openDialogWindow("shareCode"); //prompt uploading window
            var ref = this.db.ref('levels/' + name);
            ref.set({ levelMap: levelMap },
                function(error){
                    if (error) { //error uploading
                        window.Game.dialog.openDialogWindow("uploadError");
                    }
                    else { //successful upload
                        window.Game.dialog.createInputDialog(); //prevent null values
                        window.Game.dialog.input.value = "#"+name;
                        window.Game.dialog.openDialogWindow("uploadSuccess");
                    }
                }
            );
        };
        this.loadLevelFromFirebase = function(name){
            this.clearFirebaseLocalStorage();
            window.Game.dialog.openDialogWindow("downloading"); //prompt downloading window
            var ref = this.db.ref('levels/' + name);
            var levelMap = "";
            ref.once("value").then(function(snapshot) {
                if (snapshot.val() !== null && name.length > 0){
                    levelMap = snapshot.val().levelMap;
                    window.storageManager.trimLevel(levelMap);
                    window.Game.levelMap.createMapFromString(window.storageManager.levelString);
                    window.Game.levelMap.renderMap(); //render 2d array and cache it
                    window.Game.setView(2,3); //fake previous view to level editor
                    window.Game.levelEditor.updateUI(1);
                    window.Game.player.respawn();
                    window.Game.interface.build();
                    window.Game.pauseGame();
                    window.Game.dialog.openDialogWindow("downloadSuccess"); //download success
                    //ref.remove(); //delete after it has been shared
                }
                else window.Game.dialog.openDialogWindow("error404"); //download error 404
            }, function(err){
                window.Game.dialog.openDialogWindow("error500"); //download error 500
            });
        };

        this.createMapCanvas = function(levelMap){
            var canvas = document.createElement("CANVAS");
            var ctx = canvas.getContext("2d");
            canvas.width = levelMap.getCols();
            canvas.height = levelMap.getRows();
            ctx.fillStyle = "#ffffff"; //draw background
            ctx.fillRect(0,0,canvas.width,canvas.height);

            //draw each tile
            var t = 0; //tile type (255 options possible)
            for (var row=0; row < levelMap.map.length; row++){
                for (var col=0; col < levelMap.map[row].length; col++){
                    t = parseInt(('0'+levelMap.map[row][col].type).slice(-2));
                    if (t > 0){
                        ctx.fillStyle = window.lb.rgbToHex("rgb("+t+", "+t+", "+t+");");
                        ctx.fillRect(col,row,1,1);
                    }
                }
            }
            return canvas;
        };
        this.exportMapToPNG = function(levelMap, fileName){
            var canvas = this.createMapCanvas(levelMap);

            fileName = fileName != null ? fileName : "boxel-level";
            var MIME_TYPE = "image/png"; //set type
            var imgURL = canvas.toDataURL(MIME_TYPE);

            var dlLink = document.createElement('a'); //temporary link
            dlLink.download = fileName; //temporary name
            dlLink.href = imgURL;
            dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

            document.body.appendChild(dlLink);
            dlLink.click();
            document.body.removeChild(dlLink);
        };
        this.clearFirebaseLocalStorage = function(){
            var i = localStorage.length;
            while(i--) {
                var key = localStorage.key(i);
                if(window.lb.occurrences(key,"firebase") > 0) {
                    localStorage.removeItem(key);
                }
            }
        };
        this.saveLevelScore = function(index, score){
            localStorage.setItem("level_" + index + "_score", score);
            return index;
        };
        this.getLevelScore = function(level){ 
            var key = localStorage.getItem("level_"+level+"_score");
            return key !== null ? key : "00:00"; 
        };
        this.storeVolume = function(volume){
            localStorage.setItem("volume", volume);
        };
        this.getVolume = function(){
            volume = localStorage.getItem("volume");
            return volume !== null ? volume : 1; //set 100% volume if empty
        };
        this.getTotalScoreString = function(raw){
            var score = 0;
            var localScore = "";
            var i = 1;
            while (localScore != "00:00"){
                localScore = window.storageManager.getLevelScore(i);
                score += parseInt(localScore.replace(':',''));
                i++;
            }
            score += "";
            if (raw) score = score.splice(score.length - 2, 0, "."); //splice prototype from LunchBox.js;
            else score = Number(score).toLocaleString();
            return score
        }

        //initiate variables
        this.init();
	}
}(window));