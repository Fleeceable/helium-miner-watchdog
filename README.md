# helium-miner-watchdog
If watchdog is useful for you, feel free to dip some HNT. <br>
![image](https://user-images.githubusercontent.com/90242002/132324949-22135e10-5531-447a-a50b-f93de121b63f.png) <br>
14faPbrrcdhNSG2EXiGuox4qkfcWNJmHmYYeSA8s8MvYcAeSxEE<br>


  This document describes how to keep an eye of your Helium miner(s). Supported miners are **NEBRA** and **HELTEC**.<br>
  Basically you need some hardware (I used Linux Mint) and operating system where you can run nodejs (You can run it on windows machine also but it needs to be on site 24/7 and running. When using windows I suggest to use Visual Studio Code). Program checks cyclically if miner UI works and takes data from your miner to analyze if everything is okay. Notification is done via Telegram app (IOS and Android). <br>Here is example: <br>
![image](https://user-images.githubusercontent.com/90242002/142509381-70530616-6111-4b76-981d-3bcb64ca91a0.png) <br>

You will get all kind of notifications:
1. Miner watchdog is activated. That means check service is started.
2. Miner block heigh is back more than X blocks. You can change it by yourself.
3. Miner firmware was updated.
4. Miner local UI is not responding. I usually wait ~30 minutes and if miner status is not changed back to normal, I’ll dig into it to check what is wrong. I suggest to use wifi smart plugs so you can restart miner remotelly. By default program checks miner UI every 5 minutes.
5. You got reward if you have enabled that on config file. 
6. You can check your accounts 1 day, 7 day, 14 day, 30 day, total rewards.

<b><h1>Telegram</h1></b><br>
Create a bot using BotFather. Here is video link how to do that:
https://youtu.be/XoryoE9V88E?t=104 <br>
Create a new group and add bot to your group.
Take a group id from browser:<br>
![image](https://user-images.githubusercontent.com/90242002/132314917-2bcb191c-98be-4aa0-91a6-1d0933d51fd9.png)<br>

**If you cannot find group_id in the link. Follow these steps:**

**1.** Add your API token to the following url and navigate with browser. <br>
[](https://api.telegram.org/bot<YourBOTToken>/getUpdates)
When you edit, it will look like this as an example <br>
https://api.telegram.org/bot123456789:jbd78sadvbdy63d37gda37bd8/getUpdates

**2.** Expected response: <br>

```yaml
{{"update_id":8393,"message":{"message_id":3,"from":{"id":7474,"first_name":"AAA"},"chat":{"id":<group_ID>,"title":""},"date":25497,"new_chat_participant":{"id":71,"first_name":"NAME","username":"YOUR_BOT_NAME"}}}
``` 

If you get respnose like this 
```yaml 
{"ok":true,"result":[]}
``` 
Remove the bot from the group and add it again. It will be fixed. <br>
**3.** Group chat_id written after chat word "chat":{"id":-1001234567891,"title"}}


Test if bot is working with this command:<br><br>
<i><b>https://api.telegram.org/bot<BOT_TOKEN_HERE>/sendMessage?chat_id=<CHAT_ID_HERE>&text=Testing_bot</b></i><br><br>
Change these values <BOT_TOKEN_HERE> and <CHAT_ID_HERE> in link and paste it in your browser.
Hit ENTER.
If you get the message in Telegram you are done in here and can go to change config.js file with Visual Studio Code or with some text editor software.<br><br>
   <b><h1>Code, modifications and installation</h1></b><br>
  You need to change ONLY **config.js** file<br>

| Variable      | Info      | Allowed values      |Default value|
|------------|-------------|-------------|-------------|
| token | Your telegram bot token | - |-|
| chatId | Your telegram chat ID | - |-|
| MinerManufacture | Your miner manufacture | Nebra ; Heltec |- |
| MinerNickname | Your miner nickname | Any |- |
| PublicAddress | Your miner public address | - |- |
| MinerLocalIP | Your miner local IP. If you forward miner 80 port to outside, you can enter outside IP with port | - |- |
| MinerAuthorizationKey | Heltec local UI authorization key(1) | - |- |
| MinerWatchdog | enable/disable watchdog for that miner | true ; false |- |
| RewardCheck | Notify you when miner gets reward | true ; false |- |
| AccountNickname | Your Helium account nickname | Any |- |
| PublicAddress | Your Helium account public address | - |- |
| BlockHeightDifference | How many blocks can miner be out of sync | Any | 15 |
| MinerCheckTime | Miner check time in minutes | Any | 5 |
| MinerDoubleCheckCount | If error how many times check before notify | Any | 3 |
| RewardCheckTime | Check rewards on every X minutes | Any | 3 |<br>

(1) To get Heltec miner authorization key log in to local dash. Right click on UI page -> "Inspect". Choose network from upper menu, refresh page, and click on apply.php. Press headers and find out Authorization. Here is example: <br>
![image](https://user-images.githubusercontent.com/90242002/143001231-4fa5d566-9933-4002-ac03-25c8aeb4c30b.png) <br>
Note: Every time you change password you need to copy new authorization key.
<br>
<br>
  <h2> Installation and programs </h2>
  Install nodejs from here: https://nodejs.org/en/ <br>
  I'm using v16.8.0 and it's working fine.
  I prefer to use Visual Studio Code but you can run program also to your windows command promt. <br>
  Visual studio Code: https://code.visualstudio.com/ <br>
  
  Create folder to somewhere in your hard drive. Example C:\Helium and download both files from github to there (app.js and config.js)<br>
  Open config.js with visual studio code and edit file. Save it and you are done with settings. <br>
  <br>
  Not let's install fetch module. Enter command to Visual Studio Code terminal -> "cd C:\Helium"<br>
  Now enter command -> "npm init -y" and after that this -> "npm install node-fetch@2.0"<br>
  <br>
  Well done. Now let's start the code with command -> "node app.js" and you should see that it notify you in telegram that bot is running.
  
  
  
