/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/

// UI stuff
function addBlockToLoadingBar() {
    statusBoxLoadingBar.appendChild(document.createElement("div"));
}

function clearLoadingBar() {
    statusBoxLoadingBar.innerHTML = "";
}

// This function should be called if an externally-caused error occurs anywhere.
// This function hides the entire game, will cause everything to reset and re-initialize.
// It will show the loading bar and status, or an error message describing what's wrong.
function notConnected() {
    if (initializing) errorDuringInitialization = true;
    connected = false;
    
    // Display the error announcement box if the user uses MetaMask
    if (web3.currentProvider.isMetaMask === true) {
        $("errorAnnouncementBox").classList.add("errorAnnouncementBoxDisplayed");
    }
    
    if (initializingFailedBecauseWrongNetwork) {
        connected = true;
        statusBoxStatus.innerHTML = "Invalid network! Please switch to " + REQUIRED_NETWORK_NAME + "!";
        
        // Keep polling until we are on the correct network
        setTimeout(pollForCorrectNetwork, 1000);
    }
    
    else if (initializingFailedBecauseNotSyncedBlocksBehind != null) {
        statusBoxStatus.innerHTML = "Your BSC client is not synchronized:<br/>It's about " + initializingFailedBecauseNotSyncedBlocksBehind + " blocks behind.<br/><br/>Please wait until it has synchronized more.";
    }
    
    else if (initializationFailedBecauseOfIllegalContractOutput === true) {
        connected = true;
        statusBoxStatus.innerHTML = "An unknown error occurred!<br/><br/><span style='font-size: 15pt;'>Technical data:<br/>Illegal contract output: We received 0x000000 from the contract where it must be non-zero!</span><br/><br/>You can contact the administrator at:<br/>pyramidgame@jesbus.com";
    }
    
    else if (initializingFailedBecauseNoAccounts) {
        connected = true;
        if (web3.currentProvider.isMetaMask === true) {
            statusBoxStatus.innerHTML = "No accounts found!<br/>Maybe you haven't logged in or connected to MetaMask yet?<br/><br/><a href='#' onclick='window.ethereum.enable();return false;'>Connect</a>";
        }
        
        else if (typeof(mist) !== "undefined") {
            statusBoxStatus.innerHTML = "No accounts found! Maybe you haven't given this app permission to view accounts? Mist should have a '<b style='color: rgb(130, 165, 205); background-color: white; padding: 5px; font-size: 10pt;margin: 0px 5px 0px 5px;font-family: Arial;'>CONNECT</b>' button to the top-right of this page.<br/><br/>If you believe this is an error, you can contact the administrator at: info@jesbus.com<br/><br/><a href='#' onclick='window.ethereum.enable();return false;'>Connect</a>";
        }
        
        // Unknown client
        else {
            statusBoxStatus.innerHTML = "No accounts found! Maybe you haven't logged in to your BSC client yet, or maybe you haven't given this app permission to view accounts?<br/><br/>If you believe this is an error, you can contact the administrator at: info@jesbus.com<br/><br/><a href='#' onclick='window.ethereum.enable();return false;'>Connect</a>";
        }
        
        // Keep polling until we can access accounts
        setTimeout(pollForAccessToAccounts, 1000);
    }
    
    // If the user is on a mobile OS, give them the bad news
    else if (isAndroidOriOSorWindowsPhone()) {
        statusBoxStatus.innerHTML = "Unfortunately this DApp currently does not support mobile devices...<br/><br/>... but you can try it on a PC, Mac or laptop!";
    }
    
    // If the user is using Chrome, recommend MetaMask
    else if (isChrome()) {
        statusBoxStatus.innerHTML = "Could not connect to the Binance Smart Chain network!<br/><br/>If you haven't installed BSC yet, we recommend the <a href='#' onclick='chrome.webstore.install(\"https://chrome.google.com/webstore/detail/nkbihfbeogaeaoehlefnkodbefgpgknn\");'>MetaMask Chrome plugin.</a><br/><br/>If you have already installed BSC, please make sure it is running, it is synchronized and this app has permission to access it.<br/><br/>You can contact the administrator at: info@jesbus.com";
    } else {
        statusBoxStatus.innerHTML = "Could not connect to the Binance Smart Chain network!<br/><br/>If you haven't installed BSC yet, we recommend using the Google Chrome browser with the MetaMask plugin, or installing <a href='https://parity.io/' target='_blank'>Parity</a><br/><br/>If you have already installed BSC, please make sure it is running, it is synchronized and this app has permission to access it.<br/><br/>You can contact the administrator at: info@jesbus.com";
    }
    
    statusBox.classList.add("statusBoxMiddleOfScreen");
    statusBox.classList.remove("statusBoxTopLeft");
    
    hideAccountBar();
    
    hideChatbox();
    
    hideLeaderboard();
    
    chatboxArrow.style.opacity = 0.0;
    accountBarArrow.style.opacity = 0.0;
    
    pyramidField.classList.remove("animateBlockAppear");
    pyramidField.style.display = "none";
    
    statusBoxLoadingBar.style.display = "none";
    
    if (window.browserInjectedPlugin === false) {
        window.web3 = undefined;
    }
}


function pollForAccessToAccounts() {
    if (!connected) return;
    
    console.log("Polling for access to accounts...");
    getAccountsAsync().then(async function(accs){
        if (accs.length != 0) {
            console.log("We now have access to accounts! Re-initializing...");
            initializingFailedBecauseNoAccounts = false;
            errorDuringInitialization = false;
            init();
        } else {
            console.log("No access to accounts!");
            setTimeout(pollForAccessToAccounts, 1000);
        }
    },
    function(err){
        console.log("Not connected because of error in pollForAccessToAccounts() in getAccountsAsync() callback:");
        notConnected();
    });
}


function pollForCorrectNetwork() {
    if (!connected) return;
    
    console.log("Polling for correct network ID...");
    getNetworkIdAsync().then(async function(id){
        currentNetworkId = id;
        if (currentNetworkId != REQUIRED_NETWORK_ID) {
            console.log("Still on invalid network ID: " + currentNetworkId);
            setTimeout(pollForCorrectNetwork, 1000);
        } else {
            console.log("We are now in the correct network! Re-initializing...");
            initializingFailedBecauseWrongNetwork = false;
            errorDuringInitialization = false;
            init();
        }
    },
    function(err){
        console.log("Not connected because of error in pollForCorrectNetwork() in getNetworkIdAsync() callback:");
        notConnected();
    });
}


async function init() {
    // Prevent the init() function from running multiple times simultaneously
    if (initializing) {
        console.log("init() called, but it's already running! initializing=" + initializing);
        return;
    }
    if (!errorDuringInitialization) {
        statusBoxLoadingBar.style.display = "inline-block";
        $("statusBoxStatus").innerHTML = "Connecting...";
    }
    
    // Display the error announcement box if the user uses MetaMask
    if (typeof web3 !== 'undefined') {
        if (web3.currentProvider.isMetaMask === true) {
            $("errorAnnouncementBox").classList.add("errorAnnouncementBoxDisplayed");
        }
    }
    
    window.browserInjectedPlugin = null;
    
    binanceSmartChain = null;
    
    initializingFailedBecauseNoAccounts = false;
    initializingFailedBecauseWrongNetwork = false;
    initializingFailedBecauseNotSyncedBlocksBehind = null;
    initializationFailedBecauseOfIllegalContractOutput = false;
    initializing = true;
    pyramidBottomLayerWei = null;
    errorDuringInitialization = false;
    pyramidTotalBlocks = 0;
    gameInstance = null;
    currentNetworkId = null;
    
    /*if (pyramidField != null) pyramidFieldContainer.removeChild(pyramidField);
    pyramidField = null;
    pyramidField = document.createElement("div");
    pyramidField.setAttribute("id", "pyramidField");*/
    
    chatboxUsername.innerHTML = "";
    chatMessagesDiv.innerHTML = "";
    
    currentTotalChatMessages = 0;
    
    accounts = [];
    accountBalances = [];
    accountPictures = [];
	accountsBalanceBeingWithdrawn = [];
	accountsLoaded = 0;

    pyramidHighestYWithPlacedBlock = null;
	pyramidHighestXWithPlacedBlock = null;
	pyramidLowestXWithPlacedBlock = null;

    pyramidHighestYonInit = null;

    addressMetadata = {};
	pyramidGrid = [];
	pyramidHtmlBlockElements = [];
	betsSubmittedAndWaitingFor = [];
    
    currentEthPricePerUSD = 0;
    currentBSCPricePerUSD = 0;
    
    // Check for mobile devices early to show the error screen fast
    if (isAndroidOriOSorWindowsPhone()) {
        notConnected();
        return;
    }
    
    // Check if the browser is compatible with the DApp and the BSC network
    if (window.web3) {
        window.browserInjectedPlugin = true;
        
        // We use the 'load' event in the window because web3.currentProvider.enable() can show a popup, which needs to be confirmed before
        // any async/await promise can be made in a user event handler
        window.addEventListener("load", async function(){
            // Modern dapp browsers...
            if (window.ethereum) {
                window.web3 = new Web3(ethereum);
                try {
                    // Request account access if needed
                    await ethereum.enable();
                    initWeb3();
                }
                catch (error) {
                    // User denied account access...
                    console.error("User denied account access");
                    notConnected();
                }
            }
            // Legacy dapp browsers...
            else if (window.web3) {
                window.web3 = new Web3(web3.currentProvider);
                initWeb3();
            }
            // Non-dapp browsers...
            else {
                console.log("Non-Ethereum browser detected. You should consider trying MetaMask!");
                notConnected();
            }
        });
    } else {
        console.log("No web3 detected.");
        notConnected();
    }
}


async function initWeb3() {
    window.web3.eth.getAccounts(async function(err, accs){
        if (err != null) {
            console.log("There was an error fetching your accounts.");
            notConnected();
            return;
        }
        
        if (accs.length == 0) {
            console.log("No accounts found! Make sure your Binance Smart Chain client is configured correctly.");
            initializingFailedBecauseNoAccounts = true;
            notConnected();
            return;
        }
        
        accounts = accs;
        
        console.log("Accounts found: "+accounts.length);
        
        // If we arrive here, we can use the dApp
        getNetworkIdAsync().then(async function(id){
            currentNetworkId = id;
            
            if (currentNetworkId != REQUIRED_NETWORK_ID) {
                console.log("Connected to wrong network: "+currentNetworkId);
                initializingFailedBecauseWrongNetwork = true;
                notConnected();
                return;
            }
            
            initContract();
        },
        function(err){
            console.log("Error during getNetworkIdAsync() callback");
            notConnected();
        });
    });
}


async function getNetworkIdAsync() {
    return new Promise(function(resolve, reject){
        window.web3.eth.net.getId(function(err, id){
            if (err) reject(err);
            else resolve(id);
        });
    });
}


async function getAccountsAsync() {
    return new Promise(function(resolve, reject){
        window.web3.eth.getAccounts(function(err, accs){
            if (err) reject(err);
            else resolve(accs);
        });
    });
}


async function initContract() {
    // Retrieve contract details
    gameInstance = new web3.eth.Contract([
        {
            "constant": true,
            "inputs": [],
            "name": "blocksPerLevel",
            "outputs": [
                {
                    "name": "",
                    "type": "uint8"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "pyramidBottomLayerWei",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "getTotalBlocks",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "addBlock",
            "outputs": [],
            "payable": true,
            "stateMutability": "payable",
            "type": "function"
        }
    ], CONTRACT_ADDRESS);
    
    console.log("Contract instance created.");
    
    try {
        // Retrieve contract details
        const blocksPerLevel = await gameInstance.methods.blocksPerLevel().call();
        console.log("blocksPerLevel: "+blocksPerLevel);
        
        pyramidBottomLayerWei = await gameInstance.methods.pyramidBottomLayerWei().call();
        console.log("pyramidBottomLayerWei: "+pyramidBottomLayerWei);
        
        pyramidTotalBlocks = await gameInstance.methods.getTotalBlocks().call();
        console.log("Total blocks: "+pyramidTotalBlocks);
    } catch (err) {
        console.log("Error while retrieving contract details: "+err);
        initializationFailedBecauseOfIllegalContractOutput = true;
        notConnected();
        return;
    }
    
    initializeGameUI();
}


// This function is called by the game script when the page is ready
function initializeGameUI() {
    // Prevent the UI from loading multiple times
    if (initializing) return;
    
    // Hide the loading bar
    statusBoxLoadingBar.style.display = "none";
    
    // Display the account bar
    showAccountBar();
    
    // Display the chatbox
    showChatbox();
    
    // Initialize the leaderboard
    initializeLeaderboard();
    
    // Load the pyramid blocks
    addBlockToLoadingBar();
    
    // Update the status box
    statusBoxStatus.innerHTML = "Successfully connected!";
    
    // Show the game UI
    pyramidField.classList.add("animateBlockAppear");
    pyramidField.style.display = "block";
}
