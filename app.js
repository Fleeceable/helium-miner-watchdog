//***************************************************//
//*****************HELIUM MINER WATCHDOG*****************//
//*************************v1.0*************************//
//***************CREATED BY : FLEECEABLE****************//
//******************************************************//
//**********************CHANGELOG***********************//
const watchdogversion = 'v1.0'

//************TIME SETTINGS************

var block_height_back 												//How many blocks can miner be back from blockchain [Default:10]
var miner_check_time 													//Cyclical check time in minutes [Default: 5]
var miner_check_count_before_notify 										//Miner doesn't respond at least 3 times then send notification [Default: 3]
var RewardCheckTime 	
												//Reward check time in minutes [Default: 3]
//************SETTINGS VARIABLES************
var token ;
var chatId ;
arrMiners = [];
AccountAddress = [];
//************!!!!!!!!!!!!!DO NOT EDIT BELOW THIS LINE!!!!!!!!!!!!************

const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const https = require('https');


var today = new Date();
var time ;

var MinerHealth = []; // Sub array for every miner -> [0] Miner Block height | [1] Blockchain block height | [2] FW version | [3] Connected to blockchain | [4] Miner relayd | [5] ECC Detected | [6] Bluetooth detected | [7] Lora operational | [8] Update time | [9] Error count to load json | [10] Block height error | [11] Miner overall status | [12] Heltec helium FW
var firstcycle = true;
let oraclecurrentprice = 0;
let helpvar = ['', ''];
let ackalert = [];


gettime();

const fs = require('fs')

fs.readFile('./config.js', 'utf8' , (err, data) => {
  if (err) {
    console.log("[" + time + "] - " + 'Error to load config file...')
    return
  }
  let config =JSON.parse(data)
  token = config.TelegramSettings[0].token
  chatId = config.TelegramSettings[0].chatId
  arrMiners = config.Miners
  AccountAddress = config.Accounts
  block_height_back = config.TimeSettings[0].BlockHeightDifference
  miner_check_time = config.TimeSettings[0].MinerCheckTime
  miner_check_count_before_notify = config.TimeSettings[0].MinerDoubleCheckCount
  RewardCheckTime = config.TimeSettings[0].RewardCheckTime

console.log("[" + time + "] - " + 'Config file loaded successfully..')
setTimeout(function(){
  startWatchdog();
},1000);
})

function gettime(){
	let today = new Date();
    if (today.getHours() < 10 && today.getMinutes() < 10 ){
		time = "0" + today.getHours() + ":0" + today.getMinutes();
	}
	else if (today.getHours() < 10) {
		time = "0" + today.getHours() + today.getMinutes();
	}
	else if (today.getMinutes() < 10){
		time = today.getHours() + ":0" + today.getMinutes();
	}
	else{
		time = today.getHours() + ":" + today.getMinutes();
	}
}




function startWatchdog () {


//**********TELEGRAM POLLING**********
const bot = new TelegramBot(token, {polling: true});
	bot.on('message', (msg) => {
		const chatId = msg.chat.id;

	    if (msg.text == '/status') {
            for (let i = 0; i <= arrMiners.length-1; i++){
                checkminer(i,1);
            }
	    }
        else if (msg.text == '/1'){
            checkbalance(1)
        }
        else if (msg.text == '/7'){
            checkbalance(7)
        }
        else if (msg.text == '/14' ){
            checkbalance(14)
        }
        else if (msg.text == '/30'){
            checkbalance(30)
        }
        else if (msg.text == '/total'){
            checkbalance(0)
        }
        else if (msg.text == '/rewards'){
            bot.sendMessage(chatId, 'Checking any new rewards...')
            getoracleprice()
            for (let i = 0; i <= arrMiners.length-1; i++){
                checkrewards(i,true)
            }
        }
        else if (msg.text == '/oracle'){
            getoracleprice(true)
        }
        else if (msg.text.slice(msg.text.length - 4) == '_ACK'){
            for (let i = 0; i <= arrMiners.length-1; i++){
                if (msg.text == '/' + i + '_ACK'){
                    ackalert[i]=true
                    bot.sendMessage(chatId, arrMiners[i].MinerNickname + ' You do not receive any more connection notifications until miner is working again...') 
                    console.log("[" + time + "] - " + arrMiners[i].MinerNickname + ' You do not receive any more connection notifications until miner is working again...')
                }
            }
        }
        else if (msg.text == '/version'){
            bot.sendMessage(chatId, 'Miner watchdog current version: ' + watchdogversion)
        }
        else if (msg.text == '/miners' || msg.text == '/miner' ){
            for (let i = 0; i <= arrMiners.length-1; i++){
                if (arrMiners[i].MinerLocalIP == ''){
                    sendMessage = arrMiners[i].MinerNickname + '\n' + 'IP: -' + '\n'+ 'Miner check: ' +  arrMiners[i].MinerWatchdog + '\n'+ 'Errors acknowledged: ' +  ackalert[i] + '\n' + 'Reward check: ' + arrMiners[i].RewardCheck
                }
                else {
                    sendMessage = arrMiners[i].MinerNickname + '\n' + 'IP: ' + 'http://'  + arrMiners[i].MinerLocalIP + '\n'+ 'Miner check: ' +  arrMiners[i].MinerWatchdog + '\n'+ 'Errors acknowledged: ' +  ackalert[i] + '\n' + 'Reward check: ' + arrMiners[i].RewardCheck
                }
                //console.log(sendMessage)
                bot.sendMessage(chatId, sendMessage)
            }  
        }
        else if (msg.text == '/help' || msg.text == '/info' || msg.text == '/i'  ){
            bot.sendMessage(chatId, "Allowed commands are: \n/status - get miner(s) info \n/miners - get miner(s) watchdog settings \n/rewards - check any new rewards \n/1 - get 1 day account rewards \n/7 - get 7 day account rewards \n/14 - get 14 day account rewards \n/30 - get 30 day account rewards \n/total - get account(s) total rewards \n/oracle - get oracle HNT price \n/version - get watchdog current version")

        }
	});

//**********GET LOCAL TIME**********

bot.sendMessage(chatId, 'Watchdog [' + watchdogversion + '] started...')
console.log("[" + time + "] - " + 'Watchdog [' + watchdogversion + '] started...')
getoracleprice()


 // console.log(config)
  //miner1 = config.Miners[0].MinerNickname
  //miner2 = config.Miners[1].MinerNickname
  //  console.log(config.Miners[0].MinerManufacture)


//**********INITIALIZATION**********
for (let o = 0; o < arrMiners.length; o++){
    MinerHealth[o] = new Array();
    MinerHealth[o][2] = '';
    MinerHealth[o][9]=0;
    MinerHealth[o][10]=false
    ackalert[o]=false
}

//**********MINER STATUS PERIODICAL CHECK**********
setInterval(function(){
    gettime();
    console.log("[" + time + "] - " + 'Checking miner status...')
	for (let i = 0; i <= arrMiners.length-1; i++){
        checkminer(i,false);
    }
},miner_check_time*60*1000);

//**********MINER REWARD PERIODICAL CHECK**********
setInterval(function(){
    gettime()
    getoracleprice(false)
    console.log("[" + time + "] - " + 'Checking rewards...');
    
	for (let i = 0; i <= arrMiners.length-1; i++){
        checkrewards(i)
    }
},RewardCheckTime*60*1000);

//**********CHECK MINERS LOCAL DIAGNOSTIC PAGE**********
function checkminer (arrElement,reportStatus){
    if (arrMiners[arrElement].MinerWatchdog == 'true' && arrMiners[arrElement].MinerLocalIP !='' && arrMiners[arrElement].MinerManufacture == 'Nebra') {
        let chk = http.get("http://" + arrMiners[arrElement].MinerLocalIP + "/json",(res) => {
            let body = "";  
            res.on("data", (chunk) => {
                body += chunk;
            });

            res.on("end", () => {
                if (body.charAt(0) == '{') {
                    let json = JSON.parse(body);
                    if (firstcycle == true) {
                        MinerHealth[arrElement][3]= json.MC
                        MinerHealth[arrElement][4]= json.MR
                        MinerHealth[arrElement][7]= json.LOR
                        if (arrElement == arrMiners.length-1) {
                            firstcycle = false
                        }
                    }
                    MinerHealth[arrElement][9]=0
                    MinerHealth[arrElement][0]= json.MH             //miner block height
                    MinerHealth[arrElement][1]= json.BCH            //blockchain block height
                    //MinerHealth[arrElement][2]= json.FW           //miner firmware
                    //MinerHealth[arrElement][3]= json.MC            //connected to helium network
                    //MinerHealth[arrElement][4]= json.MR           //miner relayed 
                    MinerHealth[arrElement][5]= json.ECC            //ECC detected
                    MinerHealth[arrElement][6]= json.BT             //Bluetooth detected
                    //MinerHealth[arrElement][7]= json.LOR          //lora operational
                    MinerHealth[arrElement][8]= json.last_updated   //last updated
                    //MinerHealth[arrElement][9]=                   //error to read json count
                    //MinerHealth[arrElement][10]=                  //block height error
                    MinerHealth[arrElement][11]= json.PF            //overall diagnostics have passed



                    if (reportStatus == 1){
                        bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + '\nHeight Status: ' + json.MH + '/' + json.BCH + '\nFW version: ' + json.FW + '\nMiner Relayed: ' + json.MR + '\nLoRa Operational: ' + json.LOR + '\nBlockchain Connection : ' + json.MC + '\nLast updated: ' + json.last_updated);
                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Height Status: [' + json.MH + '/' + json.BCH + "] | " + 'FW version: [' + json.FW + "] | " +'Miner Relayed: [' + json.MR + '] | '+ 'LoRa Operational: [' + json.LOR + '] | ' + 'Blockchain Connection [' + json.MC + '] | ' + 'Last updated: [' + json.last_updated + ']');
                    }
                    else {
                        if (json.MH < json.BCH-block_height_back) {
                            if (MinerHealth[arrElement][10] == false) {
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + '\nMiner status: ERROR! - Your miner blockchain height is back '+ (json.BCH - json.MH)  + ' blocks.' + ' Height Status: ' + json.MH + '/' + json.BCH);
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Miner status: ERROR! - Your miner blockchain height is back more than ' + block_height_back + ' blocks.' + ' Height Status: ' + json.MH + '/' + json.BCH);
                                MinerHealth[arrElement][10]=true;
                            }
                        }
                        else {
                            if (MinerHealth[arrElement][10] == true) {
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Miner status: OK - Your miner is back on action.' + ' Height Status: ' + json.MH + '/' + json.BCH)
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + '\nMiner status: OK - Your miner is back on action.' + ' Height Status: ' + json.MH + '/' + json.BCH)
                                MinerHealth[arrElement][10]=false;
                                ackalert[arrElement]=true
                            }
                        }
                        if (MinerHealth[arrElement][2] != '') {
                            if (MinerHealth[arrElement][2] != json.FW) {
                                MinerHealth[arrElement][2] = json.FW;
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner FW UPDATE: - Your miner FW version is updated to ' + json.FW);
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner FW UPDATE: - Your miner FW version is updated to ' + json.FW)
                                ackalert[arrElement]=true
                            }
                        }
                        else {
                            MinerHealth[arrElement][2] = json.FW;
                        }
                        if (json.MR == true){ //relayd
                            if (MinerHealth[arrElement][4] == false){
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner is relayed')
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner is relayed')  
                                MinerHealth[arrElement][4]=true
                            }
                        }
                        else {
                            if (MinerHealth[arrElement][4] == true && MinerHealth[arrElement][11]==true){
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: OK! - Your miner is not relayed any more')
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: OK! - Your miner is not relayed any more')  
                                MinerHealth[arrElement][4]=false
                                ackalert[arrElement]=true
                            }
                            else if (MinerHealth[arrElement][4] == true && MinerHealth[arrElement][11]==false){
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner is not relayed but some systems are not operational. Please check your miner...')
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner is not relayed but some systems are not operational. Please check your miner...')  
                                MinerHealth[arrElement][4]=false
                            }
                        }
                        if (json.LOR == false){ //LORA operational
                            if (MinerHealth[arrElement][7] == true){
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner LORA module is not operational')
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner LORA module is not operational')  
                                MinerHealth[arrElement][7]=false
                            }
                            else {
                                if (MinerHealth[arrElement][7] == false && MinerHealth[arrElement][11]==true){
                                    console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: OK! - Your miner LORA module is operational')
                                    bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: OK! - Your miner LORA module is operational)') 
                                    MinerHealth[arrElement][7]=true
                                    ackalert[arrElement]=true
                                }
                                else if (MinerHealth[arrElement][7] == false && MinerHealth[arrElement][11]==false){
                                    console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner LORA module is operational but some systems are not operational. Please check your miner...')
                                    bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner LORA module is operational but some systems are not operational. Please check your miner...')  
                                    MinerHealth[arrElement][7]=true
                                } 
                            }
                        }
                        if (json.MC == false){ //not connected to helium network
                            if (MinerHealth[arrElement][3] == true){
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner is not connected to blockchain')
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner is not connected to blockchain')  
                                MinerHealth[arrElement][3]=false
                            } 
                        }
                        else {
                            if (MinerHealth[arrElement][3] == false && MinerHealth[arrElement][11]==true){
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: OK! - Your miner is connected to blockchain')
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: OK! - Your miner is connected to blockchain') 
                                MinerHealth[arrElement][3]=true
                                ackalert[arrElement]=true
                            }
                            else if (MinerHealth[arrElement][3] == false && MinerHealth[arrElement][11]==false){
                                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner is connected to blockchain but some systems are not operational. Please check your miner...')
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner status: ERROR! - Your miner is connected to blockchain but some systems are not operational. Please check your miner...')  
                                MinerHealth[arrElement][3]=true
                            } 
                        }
                    }
                }
            })
        }).on("error", (error) => {
            if (reportStatus == true) {
                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' There is problem to load local UI. Please try again...')
                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + ' There is problem to load local UI. Please try again...')
            }
            else {
                if (ackalert[arrElement] == false){
                    MinerHealth[arrElement][9]++;
                    console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Nebra API connection error. Will try again later... [Error count: ' + MinerHealth[arrElement][9] + '/' + miner_check_count_before_notify  + ']')
                    if (MinerHealth[arrElement][9] > miner_check_count_before_notify) {
                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' There is problem to load local UI. Please check your miner...')
                        bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + ' There is problem to load local UI. Please check your miner...  To acknowledge press -> /' + arrElement + '_ACK'  )
                        MinerHealth[arrElement][9]=0
                    }
                }
            }
        })
    }
    else if (arrMiners[arrElement].MinerWatchdog == 'true' && arrMiners[arrElement].MinerLocalIP !='' && arrMiners[arrElement].MinerManufacture == 'Heltec') {
        //console.log('Heltec check')
        const fetch = require('node-fetch');

        fetch("http://" + arrMiners[arrElement].MinerLocalIP + "/apply.php", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9,et;q=0.8",
                "authorization": "Basic " + arrMiners[arrElement].MinerAuthorizationKey,
                "content-type": "application/json",
                "Referer": "http://" + arrMiners[arrElement].MinerLocalIP + "/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "POST"
        }).then(res => res.text())
        .then(text => {reply(JSON.parse(text))

        }).catch(error=>{
            if (reportStatus == true) {
                    console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' There is problem to load local UI. Please try again...')
                    bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + ' There is problem to load local UI. Please try again...')
                }
                else {
                    if (ackalert[arrElement] == false){
                        MinerHealth[arrElement][9]++;
                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Heltec API connection error. Will try again later... [Error count: ' + MinerHealth[arrElement][9] + '/' + miner_check_count_before_notify  + ']')
                        if (MinerHealth[arrElement][9] > miner_check_count_before_notify) {
                            console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' There is problem to load local UI. Please check your miner...')
                            bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + ' There is problem to load local UI. Please check your miner...  To acknowledge press -> /' + arrElement + '_ACK'  )
                            MinerHealth[arrElement][9]=0
                        }
                    }
                }
            //console.log('errrrrrrror!!')
            return
        });

        function reply(json){
            if (reportStatus == 1){
                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + '\nHeight Status: ' + json.block + '/' + json.latest_block + '\nMiner FW version: ' + json.firmware + '\nHelium FW version: ' + json.miner + '\nStorage usage: ' + json.disk_G + 'GB (' + json.disk_p + '%)' +  '\nCPU temperature: ' + json.temperature + '°C');
                console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Height Status: [' + json.block + '/' + json.latest_block + '] | Miner FW version: [' + json.firmware + '] | Helium FW version: [' + json.miner + '] | Storage usage: [' + json.disk_G + ' (' + json.disk_p + '%)]' +  ' | CPU temperature: [' + json.temperature+ '°C]');
            }
            else {
                if (json.block < json.latest_block-block_height_back) {
                    if (MinerHealth[arrElement][10] == false) {
                        bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + '\nMiner status: ERROR! - Your miner blockchain height is back '+ (json.latest_block - json.block)  + ' blocks.' + ' Height Status: ' + json.block + '/' + json.latest_block);
                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Miner status: ERROR! - Your miner blockchain height is back more than ' + (json.latest_block - json.block) + ' blocks.' + ' Height Status: ' + json.block + '/' + json.latest_block);
                        MinerHealth[arrElement][10]=true;
                    }
                }
                else {
                    if (MinerHealth[arrElement][10] == true) {
                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Miner status: OK - Your miner is back on action.' + ' Height Status: ' + json.block + '/' + json.latest_block)
                        bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname + '\nMiner status: OK - Your miner is back on action.' + ' Height Status: ' + json.block + '/' + json.latest_block)
                        MinerHealth[arrElement][10]=false;
                        ackalert[arrElement]=true
                    }
                }
                if (MinerHealth[arrElement][2] != '') {
                    if (MinerHealth[arrElement][2] != json.firmware) {
                        MinerHealth[arrElement][2] = json.firmware;
                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner FW UPDATE: - Your miner FW version is updated to ' + json.firmware);
                        bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner FW UPDATE: - Your miner FW version is updated to ' + json.firmware)
                        ackalert[arrElement]=true
                    }
                }
                else {
                    MinerHealth[arrElement][2] = json.firmware;
                }
                if (MinerHealth[arrElement][12] != '') {
                    if (MinerHealth[arrElement][12] != json.miner) {
                        MinerHealth[arrElement][12] = json.miner;
                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname +' Miner Helium FW UPDATE: - Your miner FW version is updated to ' + json.miner);
                        bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname +' Miner Helium FW UPDATE: - Your miner FW version is updated to ' + json.miner)
                        ackalert[arrElement]=true
                    }
                }
                else {
                    MinerHealth[arrElement][2] = json.firmware;
                }
            }
            //console.log(json)
        }
    }
}


//**********CHECK HNT PRICE**********
function getoracleprice(reportPrice){
	let url = 'https://api.helium.io/v1/oracle/prices/current';
	https.get(url,(res) => {
		let body = "";
		res.on("data", (chunk) => {
			body += chunk;
		});

		res.on("end", () => {
            if (body.charAt(0) == '{') {
                let json = JSON.parse(body);
                if (json.data) {
                    oraclecurrentprice =  (json.data.price/100000000);

                    if (reportPrice){
                        console.log("[" + time + "] - HNT Current price: " + oraclecurrentprice.toFixed(2) + ' $')
                        bot.sendMessage(chatId, "HNT Current price: " + oraclecurrentprice.toFixed(2) + ' $')
                    }
                    else{
                        return json.data.price/100000000
                    }
                }
            }
		});
	}).on("error", (error) => {
		//console.error(error.message);
		console.log("[" + time + "] - " + 'Helium Explorer API connection error to get oracle price. Please try again later...');
        if (reportPrice){
            bot.sendMessage(chatId, 'Helium Explorer API connection error. Please try again later...')
        }
	});
};
//**********CHECK REWARDS**********
function checkrewards (arrElement, reply){
    if (arrMiners[arrElement].RewardCheck == 'true' && arrMiners[arrElement].PublicAddress !=''){
        let url = 'https://api.helium.io/v1/hotspots/' + arrMiners[arrElement].PublicAddress + '/activity?filter_types=';
        console.log(url)
        console.log("[" + time + "]")
        https.get(url,(res) => {
            //console.log(res)
            let body = "";
            res.on("data", (chunk) => {
                body += chunk;
            });
            res.on("end", () => {
                console.log('Checking ENDED!!!')
                //console.log(body)
                if (body.charAt(0) == '{') {
                    //console.log(body)
                    let json = JSON.parse(body);
                    if (json.data) {
                        if (json.data.length >= 1) {
                            console.log(json.data)
                            if (json.data[0].type == 'rewards_v2') {
                                let reward_amount = 0;
                                if (helpvar[arrElement] != json.data[0].hash) {
                                    for (ie = 0; ie < json.data[0].rewards.length; ie++){
                                        reward_amount = reward_amount + json.data[0].rewards[ie].amount;
                                    };
                                    helpvar[arrElement] = json.data[0].hash;
                                    if ((reward_amount/100000000).toFixed(3) == 0.000) {
                                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Received Mining Rewards: ' + (reward_amount/100000000).toFixed(6) + ' HNT' );
                                        sendMessage2 =arrMiners[arrElement].MinerNickname + ' Received Mining Rewards: ' + (reward_amount/100000000).toFixed(6) + ' HNT' ;
                                        bot.sendMessage(chatId, sendMessage2);
                                    }
                                    else {
                                        console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Received Mining Rewards: ' + (reward_amount/100000000).toFixed(3) + ' HNT' + '  /  ' + ((reward_amount/100000000)*oraclecurrentprice).toFixed(2) + '  $' );
                                        sendMessage2 =arrMiners[arrElement].MinerNickname + ' Received Mining Rewards: ' + (reward_amount/100000000).toFixed(3) + ' HNT' + '  /  ' + ((reward_amount/100000000)*oraclecurrentprice).toFixed(2) + ' $' ;
                                        bot.sendMessage(chatId, sendMessage2);
                                    }
                                }
                            }
                            else if (reply == true) {
                                bot.sendMessage(chatId, arrMiners[arrElement].MinerNickname+ ' There is no new rewards...');
                            }
                        }
                    }
                }
            })
        }).on("error", (error) => {
            console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Helium Explorer API connection error to check rewards. Will try again later...');
        })
    }
}

//**********ACCOUNT BALANCE SUM CHECK**********
function checkbalance (totalchecktime) {
    let promise = new Promise(function (resolve, reject) {
        setTimeout(function (){
            var rew = 0
            for (let i = 0; i <= AccountAddress.length-1; i++){  
                if (totalchecktime == 0){
                    url = 'https://api.helium.io/v1/accounts/' + AccountAddress[i].PublicAddress;
                }
                else {
                    url = 'https://api.helium.io/v1/accounts/' + AccountAddress[i].PublicAddress + '/rewards/sum?min_time=-' + totalchecktime + "%20day&bucket=day";
                }
                https.get(url,(res) => {
                    let body = "";
                    res.on("data", (chunk) => {
                        body += chunk;
                    });
            
                    res.on("end", () => {
                        let json = JSON.parse(body);
                        if (json.data) {
                            if (totalchecktime == 0){
                                rew = rew + json.data.balance/100000000
                                if (i==AccountAddress.length-1) {
                                    setTimeout(function(){
                                        resolve(rew)
                                        return
                                    },100);
                                }
                            }
                            else { 
                                for (let o = 0; o < json.data.length; o++){
                                    rew = rew + json.data[o].total;
                                    if (o==json.data.length-1 && i==AccountAddress.length-1){
                                        setTimeout(function(){
                                            resolve(rew)
                                            return
                                        },100);
                                    }
                                }
                            }   
                        }
                    });
                }).on("error", (error) => {
                    console.log("[" + time + "] - " + arrMiners[arrElement].MinerNickname + ' Helium Explorer API connection error to check rewards. Please try again later...');
                });
            }
    }, 100); 
    });

    async function asyncFunc() {
        let result = await promise; 
        //console.log(result)
        if (totalchecktime >0){
            bot.sendMessage(chatId, 'Miner(s) ' + totalchecktime + ' day rewards: ' + result.toFixed(2) + 'HNT  /  ' + (result*oraclecurrentprice).toFixed(2) + ' $')
            console.log("[" + time + "] - " + 'Miner(s) ' + totalchecktime + ' day rewards: ' + result.toFixed(2) + 'HNT  /  ' + (result*oraclecurrentprice).toFixed(2) + ' $')
        }
        else {
            bot.sendMessage(chatId, 'Miner(s) total rewards: ' + result.toFixed(2) + 'HNT  /  ' + (result*oraclecurrentprice).toFixed(2) + ' $')
            console.log("[" + time + "] - " + 'Miner(s) total rewards: ' + result.toFixed(2) + 'HNT  /  ' + (result*oraclecurrentprice).toFixed(2) + ' $')
        }
    }
    asyncFunc();
}
}
