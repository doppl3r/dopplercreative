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

//purchase functions
function getProductList() {
    console.log("google.payments.inapp.getSkuDetails");
    google.payments.inapp.getSkuDetails({
        'parameters': {env: "prod"},
        'success': onSkuDetails,
        'failure': onSkuDetailsFailed
    });
}
function onSkuDetails(response) {
    console.log("onSkuDetails", response);
    var products = response.response.details.inAppProducts;
    var count = products.length;
    for (var i = 0; i < count; i++) {
        var product = products[i];
        console.log('product: ', product);
        if (product.sku == "boxel_rebound_pro"){
            addProductToUI(product);
        }
    }
    getLicenses();
}
function onSkuDetailsFailed(response) {
    console.log("onSkuDetailsFailed", response);
    var reason = response.response.errorType;
    // update user with error and solution
    if (reason == 'TOKEN_MISSING_ERROR') $(".subtitle").html('Store is not available. Please log in to Google Chrome and turn on sync.');
    else if (reason == 'INVALID_RESPONSE_ERROR') $(".subtitle").html('Store is not available in your region.');
    else $(".subtitle").html('Store is not available. Error: ' + reason);
    $("#boxel_rebound_pro").remove(); //hide button for pro players
    ga('send', 'event', 'game', 'onSkuDetailsFailed - ' + reason);
}
function getLicenses() {
    console.log("google.payments.inapp.getPurchases");
    google.payments.inapp.getPurchases({
        'parameters': { env: "prod" },
        'success': onLicenseUpdate,
        'failure': onLicenseUpdateFailed
    });
}
function onLicenseUpdate(response) {
    console.log("onLicenseUpdate", response);
    var licenses = response.response.details;
    var count = licenses.length;
    for (var i = 0; i < count; i++) {
        var license = licenses[i];
        if (license.sku == "boxel_rebound_pro"){
            if (license.state == "ACTIVE") addLicenseDataToProduct(license);
            else if (license.state == "PENDING") addPendingInfo(license);
        }
    }
}
function onLicenseUpdateFailed(response) {
    console.log("onLicenseUpdateFailed", resonse);
    var reason = response.response.errorType;
    $("#boxel_rebound_pro").remove(); //hide button for pro players
    $(".subtitle").html('Faild to update license. Error: ' + reason);
    ga('send', 'event', 'game', 'onLicenseUpdateFailed - ' + reason);
}
function buyProduct(sku) {
    console.log("google.payments.inapp.buy", sku);
    google.payments.inapp.buy({
        parameters: {'env': "prod"},
        'sku': sku,
        'success': onPurchase,
        'failure': onPurchaseFailed
    });
    ga('send', 'event', 'game', 'buyProduct');
}
function onPurchase(purchase) {
    console.log("onPurchase", purchase);
    getLicenses();
    ga('send', 'event', 'game', 'onPurchase');
}
function onPurchaseFailed(purchase) {
    console.log("onPurchaseFailed", purchase);
    var reason = purchase.response.errorType;
    if (reason == 'PURCHASE_CANCELED') $(".subtitle").html('Purchase canceled.');
    else $(".subtitle").html('Failed to purchase product. Error: ' + reason);
    $("#boxel_rebound_pro").remove(); //hide button for pro players
    ga('send', 'event', 'game', 'onPurchaseFailed - ' + reason);
}
function consumeProduct(sku) {
    console.log("google.payments.inapp.consumePurchase", sku);
    google.payments.inapp.consumePurchase({
        'parameters': {'env': 'prod'},
        'sku': sku,
        'success': onConsume,
        'failure': onConsumeFail
    });
}
function onConsume(purchase) {
    console.log("onConsume", purchase);
    getLicenses();
    ga('send', 'event', 'game', 'onConsume');
}
function onConsumeFail(purchase) {
    console.log("onConsumeFail", purchase);
    var reason = purchase.response.errorType;
    $("#boxel_rebound_pro").remove(); //hide button for pro players
    $(".subtitle").html('onConsumeFail. ' + reason);
    ga('send', 'event', 'game', 'onConsumeFail - ' + reason);
}
function addProductToUI(product) {
    var currency_symbols = { 'USD': '$', 'EUR': '€', 'CRC': '₡', 'GBP': '£', 'ILS': '₪', 'INR': '₹', 'JPY': '¥', 'KRW': '₩', 'NGN': '₦', 'PHP': '₱', 'PLN': 'zł', 'PYG': '₲', 'THB': '฿', 'UAH': '₴', 'VND': '₫' };
    var currencyCode = product.prices[0].currencyCode;
    var currencyChar = currency_symbols[currencyCode];
    var currency = (currencyChar != null) ? currencyChar : "";
    var price = parseInt(product.prices[0].valueMicros, 10) / 1000000;
    var button = $('<a href="#" class="md-btn"></a>')
        .data('sku', product.sku)
        .attr('id', product.sku)
        .click(onActionButton)
        .append('<span class="strike">' + currency + (price + 1) + '</span> ' + currency + price);
    $(".subtitle").html('<img class="google-icon" src="img/icons/google-icon.svg" />Upgrade to <strong>PRO</strong>');
    $('.ad').append(button);
    $('.ad').append('<div class="caption" id="caption-link">+Custom Skins<br>+Unlimited levels<br>+Unlimited uploads<br>+Unlimited downloads<br>+Life time free updates</div>');
}
function addLicenseDataToProduct(license) {
    $("#boxel_rebound_pro").remove(); //hide button for pro players
    $(".subtitle").html('<img class="google-icon" src="img/icons/google-icon.svg" />Your account has been activated. Thank you for supporting Boxel Rebound!');
    localStorage.setItem('license', license.sku);
}
function addPendingInfo(license) {
    console.log('addPendingInfo');
    $("#boxel_rebound_pro").remove(); //hide button for pro players
    $(".subtitle").html('Your purchase is pending and will be available soon.');
    ga('send', 'event', 'game', 'addPendingInfo');
}
function onActionButton(evt) {
    var actionButton = $(evt.currentTarget);
    if (actionButton.data("license")) {
        console.log('license: ' + actionButton.data("license"));
        //TODO: Show that the user purchased the game
    } 
    else {
        var sku = actionButton.data("sku");
        buyProduct(sku);
    }
}
function checkExtension(){
    //show options overlay for chrome extension release
    if (chrome.extension.ViewType.TAB == "tab" && window.location.href.indexOf("fullscreen") == -1){
        document.getElementById("id-options").style.display = "block";
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
        document.getElementById("version").addEventListener("click", function(){ 
            chrome.tabs.create({ url:'https://chrome.google.com/webstore/detail/boxel-rebound/iginnfkhmmfhlkagcmpgofnjhanpmklb?hl=en-US' });
        });

        //display extension version number
        $.getJSON("../manifest.json", function(json) {
            $('#version').text('v'+json.version);
        });

        //update checkboxes onload
        updateAudioButton();
        updateFullscreenButton();
        getProductList();
    }
}
function viewAd(){
    var adLink = "http://corneey.com/wMoDnK";
    if (localStorage.getItem("fullscreen") == 1) chrome.tabs.create({ url: adLink });
    else chrome.windows.create({ width: 800, height: 600, type: "popup", url: adLink });
    //chrome.windows.create({ width: 800, height: 600, type: "popup", url: adLink });
    ga('send', 'event', 'game', 'viewAd');
}
checkExtension();