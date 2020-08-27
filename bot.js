var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client();
bot.login(auth.token);

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', msg => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (msg.content.substring(0, 1) == '=') {
        var args = msg.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            case 'ping':
                msg.channel.send({
                    content: "Pong!"
                });
                break;
            case 'ce':
                skillsToLookUp = [];
                skillToCEs = {};
                loadsDone = 0;
                for (i = 0; i < args.length; i++) {
                    if (!skillsToLookUp.includes(args[i])) {
                        console.log("Unique arg " + args[i]);
                        skillsToLookUp.push(args[i]);
                        skillToCEs[args[i]] = [];
                    }
                }
                effectCount = skillsToLookUp.length;
                for (i = 0; i < effectCount; i++) {
                    getCEsWithEffect(msg, skillsToLookUp[i]);
                }
                break;
        }
    }
});

var functionsNotBuffs = ["gainNp"];
var effectCount = 0;
var skillsToLookUp = [];
var skillToCEs = {};
var loadsDone = 0;

function getCEsWithEffect(msg, effect) {
    let request = new XMLHttpRequest();
    let buff = !functionsNotBuffs.includes(effect);
    if (!buff) {
        request.open("GET", "https://api.atlasacademy.io/basic/JP/function/search?type=" + effect + "&reverse=True&reverseDepth=servant");
    }
    else {
        request.open("GET", "https://api.atlasacademy.io/basic/JP/buff/search?type=" + effect + "&reverse=True&reverseDepth=servant");
    }
    request.send();
    request.onload = () => {
        //console.log(request);
        if (request.status == 200) {
            let obj = JSON.parse(request.responseText);
            if (buff) {
                for (buffNo = 0; buffNo < obj.length; buffNo++) {
                    if (obj[buffNo].hasOwnProperty("reverse")) {
                        if (obj[buffNo].reverse != null && obj[buffNo].reverse.hasOwnProperty("basic")) {
                            if (obj[buffNo].reverse.basic != null && obj[buffNo].reverse.basic.hasOwnProperty("function")) {
                                if (obj[buffNo].reverse.basic.function != null) {
                                    addCEsFromFunctionList(obj[buffNo].reverse.basic.function, effect);
                                }
                                else {
                                    console.log("Function list is null");
                                }
                            }
                            else {
                                console.log("Does not have property: function");
                            }
                        }
                        else {
                            console.log("Does not have property: basic");
                        }
                    }
                    else {
                        console.log("Does not have property: reverse");
                    }
                }
            }
            else {
                addCEsFromFunctionList(obj, effect);
            }
        }
        else {
            console.log(`error ${request.status} ${request.statusText}`);
        }

        loadsDone += 1;
        console.log("Finished load " + loadsDone + " of " + effectCount);
        if (loadsDone == effectCount) {
            checkCEs(msg);
        }
    }
}

function addCEsFromFunctionList(funcs, effect) {
    for (funcNo = 0; funcNo < funcs.length; funcNo++) {
        if (funcs[funcNo].hasOwnProperty("reverse")) {
            if (funcs[funcNo].reverse != null && funcs[funcNo].reverse.hasOwnProperty("basic")) {
                if (funcs[funcNo].reverse.basic != null && funcs[funcNo].reverse.basic.hasOwnProperty("skill")) {
                    if (funcs[funcNo].reverse.basic.skill != null) {
                        for (skill = 0; skill < funcs[funcNo].reverse.basic.skill.length; skill++) {
                            if (funcs[funcNo].reverse.basic.skill[skill].hasOwnProperty("reverse")) {
                                if (funcs[funcNo].reverse.basic.skill[skill].reverse != null && funcs[funcNo].reverse.basic.skill[skill].reverse.hasOwnProperty("basic")) {
                                    if (funcs[funcNo].reverse.basic.skill[skill].reverse.basic != null && funcs[funcNo].reverse.basic.skill[skill].reverse.basic.hasOwnProperty("servant")) {
                                        if (funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant != null) {
                                            for (servant = 0; servant < funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant.length; servant++) {
                                                if (funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant[servant].hasOwnProperty("type")) {
                                                    if (funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant[servant].type == "servantEquip") {
                                                        if (!listContainsCEId(skillToCEs[effect], funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant[servant])) {
                                                            console.log("Adding CE Id: " + funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant[servant].collectionNo + " to effect: " + effect);
                                                            skillToCEs[effect].push(funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant[servant]);
                                                        }
                                                    }
                                                    else {
                                                        //console.log("Is not equipment");
                                                    }
                                                }
                                                else {
                                                    console.log("Does not have property: type");
                                                }
                                            }
                                        }
                                        else {
                                            console.log("Servant list is null");
                                        }
                                    }
                                    else {
                                        console.log("Does not have property: servant");
                                    }
                                }
                            }
                            else {
                                console.log("Does not have property: reverse 2");
                            }
                        }
                    }
                    else {
                        console.log("Skill list is null");
                    }
                }
                else {
                    console.log("Does not have property: skill");
                }
            }
            else {
                console.log("Does not have property: basic");
            }
        }
        else {
            console.log("Does not have property: reverse");
        }
    }
}

function checkCEs(chatMsg) {
    let msgTitle = "CEs that have ALL of: ";
    for (i = 0; i < effectCount; i++) {
        msgTitle += skillsToLookUp[i];
        if (i < effectCount - 1) {
            msgTitle += ", ";
        }
        else {
            msgTitle += "\n";
        }
    }
    let msg = "";
    let ids = [];
    for (j = 0; j < skillToCEs[skillsToLookUp[0]].length; j++) {
        if (skillToCEs[skillsToLookUp[0]][j].collectionNo == 0) {
            continue;
        }
        console.log("Checking CE Id: " + skillToCEs[skillsToLookUp[0]][j].collectionNo + " (" + (j + 1) + " of " + skillToCEs[skillsToLookUp[0]].length + ")");
        let addCE = true;
        for (list = 1; list < effectCount; list++) {
            if (!listContainsCEId(skillToCEs[skillsToLookUp[list]], skillToCEs[skillsToLookUp[0]][j])) {
                addCE = false;
                break;
            }
        }
        if (addCE) {
            console.log("Adding!");
            ids.push(skillToCEs[skillsToLookUp[0]][j].collectionNo);
        }
        else {
            console.log("Skipping!");
        }
    }
    ids.sort((a, b) => a - b);
    let msgLong = (' ' + msg).slice(1);
    for (k = 0; k < ids.length; k++) {
        msg += ids[k] + ", ";
        msgLong += "[" + ids[k] + "](https://apps.atlasacademy.io/db/#/JP/craft-essence/" + ids[k] + "), ";
    }
    if (msgLong.length <= 2000) {
        msg = msgLong;
    }
    msg = msg.substring(0, msg.length - 2);
    chatMsg.channel.send({
        embed: {
            title: msgTitle,
            description: msg
        }
    });
}

function checkIdsEqual(ce1, ce2) {
    if (!ce1.hasOwnProperty("collectionNo") || !ce2.hasOwnProperty("collectionNo")) {
        return false;
    }
    return ce1.collectionNo == ce2.collectionNo;
}

function listContainsCEId(list, ce) {
    for (i = 0; i < list.length; i++) {
        if (checkIdsEqual(list[i], ce)) {
            return true;
        }
    }
    return false;
}