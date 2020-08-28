var Discord = require('discord.js');
var logger = require('winston');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client();
bot.login(process.env.BOT_TOKEN);

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
        switch (cmd.toLowerCase()) {
            case 'ping':
                msg.channel.send({
                    content: "Pong!"
                });
                break;
            case 'list':
                if (args.length >= 1) {
                    listEnums(msg, args[0]);
                }
                else {
                    listEnums(msg, 0);
                }
                break;
            case 'listraw':
                if (args.length >= 1) {
                    let uniqueArgs = [];
                    for (a = 0; a < args.length; a++) {
                        if (!uniqueArgs.includes(args[a])) {
                            //console.log("Unique arg " + args[a]);
                            uniqueArgs.push(args[a]);
                        }
                    }
                    filterEnums(msg, uniqueArgs);
                }
                else {
                    listEnumsDirty(msg);
                }
                break;
            case 'help':
                showHelp(msg);
                break;
            case 'ce':
                if (args.length == 0 || args[0].toLowerCase() == "help") {
                    showHelp(msg);
                }
                else if (args[0].toLowerCase() == "listraw") {
                    if (args.length >= 2) {
                        let uniqueArgs = [];
                        for (a = 1; a < args.length; a++) {
                            if (!uniqueArgs.includes(args[a])) {
                                //console.log("Unique arg " + args[a]);
                                uniqueArgs.push(args[a]);
                            }
                        }
                        filterEnums(msg, uniqueArgs);
                    }
                    else {
                        listEnumsDirty(msg);
                    }
                }
                else if (args[0].toLowerCase() == "list") {
                    if (args.length >= 2) {
                        listEnums(msg, args[1]);
                    }
                    else {
                        listEnums(msg, 0);
                    }
                }
                else {
                    skillsToLookUp = [];
                    skillToCEs = {};
                    loadsDone = 0;
                    for (i = 0; i < args.length; i++) {
                        if (!skillsToLookUp.includes(args[i])) {
                            //console.log("Unique arg " + args[i]);
                            skillsToLookUp.push(args[i]);
                            skillToCEs[args[i]] = [];
                        }
                    }
                    effectCount = skillsToLookUp.length;
                    for (i = 0; i < effectCount; i++) {
                        getCEsWithEffect(msg, skillsToLookUp[i]);
                    }
                }
                break;
        }
    }
});

var buffsEnum = ["none", "upCommandatk", "upStarweight", "upCriticalpoint", "downCriticalpoint", "regainNp", "regainStar", "regainHp", "reduceHp", "upAtk", "downAtk", "upDamage", "downDamage", "addDamage", "subDamage", "upNpdamage", "downNpdamage", "upDropnp", "upCriticaldamage", "downCriticaldamage", "upSelfdamage", "downSelfdamage", "addSelfdamage", "subSelfdamage", "avoidance", "breakAvoidance", "invincible", "upGrantstate", "downGrantstate", "upTolerance", "downTolerance", "avoidState", "donotAct", "donotSkill", "donotNoble", "donotRecovery", "disableGender", "guts", "upHate", "addIndividuality", "subIndividuality", "upDefence", "downDefence", "upCommandstar", "upCommandnp", "upCommandall", "downCommandall", "downStarweight", "reduceNp", "downDropnp", "upGainHp", "downGainHp", "downCommandatk", "downCommanstar", "downCommandnp", "upCriticalrate", "downCriticalrate", "pierceInvincible", "avoidInstantdeath", "upResistInstantdeath", "upNonresistInstantdeath", "delayFunction", "regainNpUsedNoble", "deadFunction", "upMaxhp", "downMaxhp", "addMaxhp", "subMaxhp", "battlestartFunction", "wavestartFunction", "selfturnendFunction", "upGivegainHp", "downGivegainHp", "commandattackFunction", "deadattackFunction", "upSpecialdefence", "downSpecialdefence", "upDamagedropnp", "downDamagedropnp", "entryFunction", "upChagetd", "reflectionFunction", "upGrantSubstate", "downGrantSubstate", "upToleranceSubstate", "downToleranceSubstate", "upGrantInstantdeath", "downGrantInstantdeath", "gutsRatio", "damageFunction", "upDefencecommandall", "downDefencecommandall", "overwriteBattleclass", "overwriteClassrelatioAtk", "overwriteClassrelatioDef", "upDamageIndividuality", "downDamageIndividuality", "upDamageIndividualityActiveonly", "downDamageIndividualityActiveonly", "upNpturnval", "downNpturnval", "multiattack", "upGiveNp", "downGiveNp", "upResistanceDelayNpturn", "downResistanceDelayNpturn", "pierceDefence", "upGutsHp", "downGutsHp", "upFuncgainNp", "downFuncgainNp", "upFuncHpReduce", "downFuncHpReduce", "upDefencecommanDamage", "downDefencecommanDamage", "npattackPrevBuff", "fixCommandcard", "donotGainnp", "fieldIndividuality", "donotActCommandtype", "upDamageEventPoint", "upDamageSpecial", "attackFunction", "commandcodeattackFunction", "donotNobleCondMismatch", "donotSelectCommandcard", "donotReplace", "shortenUserEquipSkill", "tdTypeChange", "overwriteClassRelation", "tdTypeChangeArts", "tdTypeChangeBuster", "tdTypeChangeQuick", "commandattackBeforeFunction", "gutsFunction", "upCriticalRateDamageTaken", "downCriticalRateDamageTaken", "upCriticalStarDamageTaken", "downCriticalStarDamageTaken", "skillRankUp", "avoidanceIndividuality", "changeCommandCardType", "specialInvincible"];
var functionsNotBuffs = ["none", "addState", "subState", "damage", "damageNp", "gainStar", "gainHp", "gainNp", "lossNp", "shortenSkill", "extendSkill", "releaseState", "lossHp", "instantDeath", "damageNpPierce", "damageNpIndividual", "addStateShort", "gainHpPer", "damageNpStateIndividual", "hastenNpturn", "delayNpturn", "damageNpHpratioHigh", "damageNpHpratioLow", "cardReset", "replaceMember", "lossHpSafe", "damageNpCounter", "damageNpStateIndividualFix", "damageNpSafe", "callServant", "ptShuffle", "lossStar", "changeServant", "changeBg", "damageValue", "withdraw", "fixCommandcard", "shortenBuffturn", "extendBuffturn", "shortenBuffcount", "extendBuffcount", "changeBgm", "displayBuffstring", "resurrection", "gainNpBuffIndividualSum", "setSystemAliveFlag", "forceInstantDeath", "damageNpRare", "gainNpFromTargets", "gainHpFromTargets", "lossHpPer", "lossHpPerSafe", "shortenUserEquipSkill", "quickChangeBg", "shiftServant", "damageNpAndCheckIndividuality", "absorbNpturn", "overwriteDeadType", "forceAllBuffNoact", "breakGaugeUp", "breakGaugeDown", "expUp", "qpUp", "dropUp", "friendPointUp", "eventDropUp", "eventDropRateUp", "eventPointUp", "eventPointRateUp", "transformServant", "qpDropUp", "servantFriendshipUp", "userEquipExpUp", "classDropUp", "enemyEncountCopyRateUp", "enemyEncountRateUp", "enemyProbDown", "getRewardGift", "sendSupportFriendPoint", "movePosition", "revival", "damageNpIndividualSum", "damageValueSafe", "friendPointUpDuplicate"];
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
        else if (request.status == 422) {
            msg.channel.send({
                content: "Unknown arg: " + effect
            });
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
                                                            //console.log("Adding CE Id: " + funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant[servant].collectionNo + " to effect: " + effect);
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
        //console.log("Checking CE Id: " + skillToCEs[skillsToLookUp[0]][j].collectionNo + " (" + (j + 1) + " of " + skillToCEs[skillsToLookUp[0]].length + ")");
        let addCE = true;
        for (list = 1; list < effectCount; list++) {
            if (!listContainsCEId(skillToCEs[skillsToLookUp[list]], skillToCEs[skillsToLookUp[0]][j])) {
                addCE = false;
                break;
            }
        }
        if (addCE) {
            //console.log("Adding!");
            ids.push(skillToCEs[skillsToLookUp[0]][j].collectionNo);
        }
        else {
            //console.log("Skipping!");
        }
    }
    ids.sort((a, b) => a - b);
    if (ids.length > 0) {
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
    else {
        chatMsg.channel.send({
            content: "Found no " + msgTitle
        });
    }
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

function listEnumsDirty(msg) {
    let strings = [""];
    let currentString = 0;
    for (b = 0; b < buffsEnum.length; b++) {
        if (strings[currentString].length + buffsEnum[b].length + 2 < 2048) {
            strings[currentString] += buffsEnum[b] + ", ";
        }
        else {
            currentString++;
            strings[currentString] = buffsEnum[b] + ", ";
        }
    }
    for (f = 0; f < functionsNotBuffs.length; f++) {
        if (strings[currentString].length + functionsNotBuffs[f].length + 2 < 2048) {
            strings[currentString] += functionsNotBuffs[f] + ", ";
        }
        else {
            currentString++;
            strings[currentString] = functionsNotBuffs[f] + ", ";
        }
    }
    strings[currentString] = strings[currentString].substring(0, strings[currentString].length - 2);
    msg.channel.send({
        embed: {
            title: "Raw Argument List:",
            description: strings[0]
        }
    });
    for (m = 1; m < strings.length; m++) {
        msg.channel.send({
            embed: {
                description: strings[m]
            }
        });
    }
}

function listEnums(msg, page) {
    let page1 = "**Command Cards:**\n<:_artsCard:745829689511116931><:_busterCard:745829693055434855><:_quickCard:745829693390848025> __Arts/Buster/Quick__ (disambiguation coming soon:tm:) - upCommandall, downCommandall\n**ATK & DEF:**\n:_charisma::_atkDown: __Attack__ - upAtk, downAtk\n:_divinity: __Divinity__ - addDamage, subDamage\n:_defUp::_defDown: __Defense__ - upDefence, downDefence; __Damage Cut__ - addSelfdamage, subSelfdamage\n:_ignoreDefense: __Ignore Defense__ - pierceDefence\n:_powermod: __Damage VS Statused__ - upDamageIndividualityActiveonly, downDamageIndividualityActiveonly\n**HP:**\n:_HoT: __Per Turn__ - regainHp, reduceHp\n:_healPower: __Healing Received__ - upGainHp, downGainHp; __Healing Given__ upGivegainHp, downGivegainHp\n:_HPUp: __Max HP__ - addMaxhp, subMaxhp\n**NP:** \n:_npCharge: __Starting NP__ - gainNp, lossNp\n:_npgenUp: __NP Gen__ - upDropnp, downDropnp\n:_attackednpgenUp: __NP Gen when Attacked__ - upDamagedropnp, downDamagedropnp\n:_npmod::_npmodDown: __NP Damage__ - upNpdamage, downNpdamage\n:_npchargePerTurn: __Per Turn__ - regainNp, reduceNp\n:_overcharge: __Overcharge__ - upChagetd\n**Critical:**\n:_critUp::_critDown: __Crit Damage__ - upCriticaldamage, downCriticaldamage\n:_starGen: __Star Gen__ - upCriticalpoint, downCriticalpoint\n:_gatherUp::_gatherDown: __Weight__ - upStarweight, downStarweight\n:_starsPerTurn: __Per Turn__ - regainStar\n:_critChanceResUp: __Chance of Taking Critical Hit__ - upCriticalRateDamageTaken, downCriticalRateDamageTaken";
    let page2 = "**Lifelines:**\n:_evade: __Evade__ - avoidance\n:_sureHit: __Sure Hit__ - breakAvoidance\n:_invul: __Invincible__ - invincible\n:_invulPierce: __Pierce Invincible__ - pierceInvincible\n:_guts: __Revive with X HP__ - guts, __Revive with %__ - gutsRatio\n:_taunt: __Taunt__ - upHate\n**Buffs:**\n:_debuffResist: __Debuff Resist__ - upTolerance, downTolerance\n:_debuffImmunity: __Debuff Immunity__ - avoidState\n:_debuffSuccessUp: __Debuff Success__ - upGrantstate, downGrantstate\n:_removalResistUp: __Buff Clear Resist__ - upToleranceSubstate, downToleranceSubstate\n:_spooky: __Instant Kill Resist__ - upResistInstantdeath, upNonresistInstantdeath\n:_deathImmunity: __Instant Kill Immunity__ - avoidInstantdeath\n:_deathRateUp: __Instant Kill Success__ - upGrantInstantdeath, downGrantInstantdeath\n:_trait: __Class Interaction__ - overwriteClassRelation\n:shikidab: *AFAIK any Buff?* - addState, subState\n**Triggers:**\n:_deadLater: __Trigger On Death__ - deadFunction\n:_triggerOnAtk: __Trigger On Card Use__ - commandattackFunction\n:landingBB: __Trigger On Enter Battle__ - entryFunction\n**Rewards:**\n:_journey: __Master XP__ - expUp; __Clothes XP__ - userEquipExpUp\n:_qpUp: __QP +X__ - qpUp, __QP +%__ - qpDropUp\n:_bond: __Bond__ - servantFriendshipUp\n:_friendshipPoint: __FP from Taking__ - friendPointUp, __FP +X__ - friendPointUpDuplicate";
    let page3 = "**Events:**\n__CE XP & Valentine's__ - none\n__Event Damage__ - upDamage, downDamage\n__Chance to Clone Enemy__ - enemyEncountCopyRateUp; __Chance to Make Enemy Appear__ - enemyEncountRateUp\n__Event Currencies__ - eventDropUp; __Chance of Dropping Event Currency__ - eventDropRateUp\n__Event Points__ - eventPointUp; __Point-based Damage (Oniland)__ - upDamageEventPoint\n__Prisma Event__ - upCommandatk, downCommandatk\n__Coin Drop (Valentine's & Fate/Zero)__ - classDropUp";
    if (page == 1) {
        msg.channel.send({
            embed: {
                title: "Argument List:",
                description: page1
            }
        });
    }
    else if (page == 2) {
        msg.channel.send({
            embed: {
                title: "Argument List:",
                description: page2
            }
        });
    }
    else if (page == 3) {
        msg.channel.send({
            embed: {
                title: "Argument List:",
                description: page3
            }
        });
    }
    else {
        msg.channel.send({
            embed: {
                title: "Argument List:",
                description: page1
            }
        });
        msg.channel.send({
            embed: {
                description: page2
            }
        });
        msg.channel.send({
            embed: {
                description: page3
            }
        });
    }
}

function showHelp(msg) {
    msg.channel.send({
        embed: {
            title: "Using Kaleidoscope",
            description: "`=ce [args]` //Get a list of all craft essences with that buff or function\n**example:** `=ce upDropnp gainNp` lists all CEs with NP Gain and Starting NP.\n\n`=list [1/2/3]` //Get a formatted list of the technical names of buffs & functions used by the game. You can specify a page if you don't want all of them.\n\n`=listRaw [args]` //Get a list of the technical names of all buffs & functions. You can also search (recommended, the full list is long):\n**example:** `=list np` lists arguments that contain 'np'."
        }
    });
}

function filterEnums(msg, args) {
    let tittle = "CE Options Containing: ";
    for (t = 0; t < args.length; t++) {
        if (t > 0) {
            tittle += " OR ";
        }
        tittle += args[t];
    }

    let strings = [""];
    let currentString = 0;
    for (b = 0; b < buffsEnum.length; b++) {
        if (containsToLower(args, buffsEnum[b])) {
            if (strings[currentString].length + buffsEnum[b].length + 2 < 2048) {
                strings[currentString] += buffsEnum[b] + ", ";
            }
            else {
                currentString++;
                strings[currentString] = buffsEnum[b] + ", ";
            }
        }
    }
    for (f = 0; f < functionsNotBuffs.length; f++) {
        if (containsToLower(args, functionsNotBuffs[f])) {
            if (strings[currentString].length + functionsNotBuffs[f].length + 2 < 2048) {
                strings[currentString] += functionsNotBuffs[f] + ", ";
            }
            else {
                currentString++;
                strings[currentString] = functionsNotBuffs[f] + ", ";
            }
        }
    }
    strings[currentString] = strings[currentString].substring(0, strings[currentString].length - 2);
    msg.channel.send({
        embed: {
            title: tittle,
            description: strings[0]
        }
    });
    for (m = 1; m < strings.length; m++) {
        msg.channel.send({
            embed: {
                description: strings[m]
            }
        });
    }
}

function containsToLower(list, string) {
    for (l = 0; l < list.length; l++) {
        //console.log("Testing if " + list[l] + " contains " + string);
        if (string.toLowerCase().includes(list[l].toLowerCase())) {
            return true;
        }
    }
    return false;
}