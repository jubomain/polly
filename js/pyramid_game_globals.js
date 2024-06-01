/*
<!--------------------------------------------------------------->
<!--                                                           -->
<!--             Copyright (C) Jesbus Technology               -->
<!-- Written by Jesse Busman <info@jesbus.com>, September 2017 -->
<!--                                                           -->
<!--------------------------------------------------------------->
*/


/**** Constants ****/

// These arrays contains the URL's where this site may be hosted at.
// They exist so we can host the same game on different domain names,
// web servers and paths without having to change anything

// These ones are prefered
let URLS_WITH_HTTP_AND_HTTPS = ["pyramidgame.jesbus.com/", "pyramidgame.jesbus.com/index.html"];

// These ones are secondary
let URLS_WITH_ONLY_HTTPS = ["jessebusman.github.io/PyramidGame/", "jessebusman.github.io/PyramidGame/index.html"];

// These ones are tertiary
let URLS_WITH_ONLY_HTTP = ["pyramidgamedev3.jesb.us/", "pyramidgamedev3.jesb.us/index.html"];

let REQUIRED_NETWORK_ID = 1;
let REQUIRED_NETWORK_NAME = "BSC Testnet";

let ADMINISTRATOR_ADDRESS = "0x699Ab5d28eCaBA20c26f4bdE9d789ee7127ebe3D";

let MAX_DISPLAYED_CHAT_MESSAGES = 50;

let GAME_ADDRESS = "0xC570b4F7fd1Ee82d475C8a79244980a08886E632";
let GAME_ABI = 
JSON.parse('[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"addressBalances","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"addressesToChatMessagesLeft","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"addressesToTotalWeiPlaced","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"addressesToUsernames","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allBlockCoordinates","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"chatMessageIndex","type":"uint256"}],"name":"censorChatMessage","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"censoredChatMessages","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"chatMessages","outputs":[{"internalType":"address","name":"person","type":"address"},{"internalType":"string","name":"message","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"","type":"uint32"}],"name":"coordinatesToAddresses","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"y","type":"uint16"}],"name":"getBetAmountAtLayer","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getChatMessageAtIndex","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTotalAmountOfBlocks","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTotalAmountOfChatMessages","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"x","type":"uint16"},{"internalType":"uint16","name":"y","type":"uint16"}],"name":"isThereABlockAtCoordinates","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"x","type":"uint16"},{"internalType":"uint16","name":"y","type":"uint16"}],"name":"placeBlock","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"username","type":"bytes32"}],"name":"registerUsername","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"message","type":"string"}],"name":"sendChatMessage","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"newFeeDivisor","type":"uint256"}],"name":"setFeeDivisor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newAdministrator","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"usernamesToAddresses","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountToWithdraw","type":"uint256"}],"name":"withdrawBalance","outputs":[],"stateMutability":"nonpayable","type":"function"}]');

// This variable basically keeps track of whether the browser tab is focused.
// If it's not focused, we don't need to waste CPU cycles on polling,
// because the user isn't watching anyway.
var shouldPollForNewBets = true;


/**** Global game variables ****/
var gameABIinstance = null;
var gameInstance = null;
var currentNetworkId = null;


/**** Game initialization state variables ****/
var initializing = false;
var errorDuringInitialization = false;
var initializingFailedBecauseNoAccounts = false;
var initializingFailedBecauseWrongNetwork = false;
var initializingFailedBecauseNotSyncedBlocksBehind = null;
initializationFailedBecauseOfIllegalContractOutput = false;
var connected = false;


/**** Account bar elements ****/
var accountBar = $("accountBar");
var accountBarArrow = $("accountBarArrow");

/* Account selector */
var divAccountSelectorContainer = $("divAccountSelectorContainer");

/* Withdraw box */
var divWithdrawableBalanceContainer = $("divWithdrawableBalanceContainer");
var divWithdrawableBalance = $("divWithdrawableBalance");
var btnWithdraw = $("btnWithdraw");
var btnWithdrawPart = $("btnWithdrawPart");


/**** Account bar state ****/
var showingAccountBar = true;

var accounts = [];
var accountBalances = [];
var accountPictures = [];
var accountsBalanceBeingWithdrawn = [];
var accountsLoaded = 0;

var selectedAccount = null;
var selectedAccountIndex = 0;
var selectedAccountUsername = null;
var selectedAccountChatMessagesLeft = null;


/**** Leaderboard ****/
var showingLeaderboard = false;
var leaderboardContainer = $("leaderboardContainer");
var leaderboardArrow = $("leaderboardArrow");


/**** Chatbox elements ****/
var chatbox = $("chatbox");
var chatboxUsername = $("chatboxUsername");
var chatMessageBox = $("chatMessageBox");
var chatboxArrow = $("chatboxArrow");


/**** Chatbox state ****/
var currentTotalChatMessages = null;
var showingChatbox = false;
var sendingChatMessage = false;
var addressesWaitingForUsername = [];


/**** Usernames ****/
var addressesToUsernames = {};


/**** Status box elements ****/

var statusBox = $("statusBox");
var statusBoxStatus = $("statusBoxStatus");
var statusBoxLoadingBar = $("statusBoxLoadingBar");


/**** Statistics ****/

var totalBlocksSpan = $("totalBlocks");


/**** Pyramid field elements ****/
var pyramidField = $("pyramidField");


/**** Pyramid field state ****/
var pyramidTotalBlocks = 0;
var pyramidBottomLayerWei = null;
var pyramidHighestYWithPlacedBlock = null;
var pyramidHighestXWithPlacedBlock = null;
var pyramidLowestXWithPlacedBlock = null;
var pyramidHighestYonInit = null;
var pyramidHighestYonInitXcoord = null;
var betsSubmittedAndWaitingFor = [];
var pyramidGrid = [];
var pyramidHtmlBlockElements = []; // contains objects of the format: {x: [INT], y: [INT], el: [ELEMENT]}
var addressMetadata = {};


/**** Performance options ****/
var hideNumbersOnBlocks = false;
var hideBlocksOutsideScreen = false;
