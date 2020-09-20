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

    bot.user.setPresence({
        status: 'online',
        activity: {
            name: 'type =help to get started',
            type: 'PLAYING'
        }
    });
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
                    for (let a = 0; a < args.length; a++) {
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
                        for (let a = 1; a < args.length; a++) {
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
                    for (let i = 0; i < args.length; i++) {
                        if (!skillsToLookUp.includes(args[i])) {
                            //console.log("Unique arg " + args[a]);

                            //Input checking
                            let theyMeant = getContentsToLower(buffsEnum, args[i]);
                            if (theyMeant == "") {
                                theyMeant = getContentsToLower(functionsNotBuffs, args[i]);
                            }
                            if (theyMeant != "") {
                                if (!skillsToLookUp.includes(theyMeant)) {
                                    skillsToLookUp.push(theyMeant);
                                    skillToCEs[theyMeant] = [];
                                }
                            }
                            else {
                                skillsToLookUp.push(args[i]);
                                skillToCEs[args[i]] = [];
                            }
                        }
                    }
                    effectCount = skillsToLookUp.length;
                    for (let i = 0; i < effectCount; i++) {
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
                for (let buffNo = 0; buffNo < obj.length; buffNo++) {
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
    for (let funcNo = 0; funcNo < funcs.length; funcNo++) {
        if (funcs[funcNo].hasOwnProperty("reverse")) {
            if (funcs[funcNo].reverse != null && funcs[funcNo].reverse.hasOwnProperty("basic")) {
                if (funcs[funcNo].reverse.basic != null && funcs[funcNo].reverse.basic.hasOwnProperty("skill")) {
                    if (funcs[funcNo].reverse.basic.skill != null) {
                        for (let skill = 0; skill < funcs[funcNo].reverse.basic.skill.length; skill++) {
                            if (funcs[funcNo].reverse.basic.skill[skill].hasOwnProperty("reverse")) {
                                if (funcs[funcNo].reverse.basic.skill[skill].reverse != null && funcs[funcNo].reverse.basic.skill[skill].reverse.hasOwnProperty("basic")) {
                                    if (funcs[funcNo].reverse.basic.skill[skill].reverse.basic != null && funcs[funcNo].reverse.basic.skill[skill].reverse.basic.hasOwnProperty("servant")) {
                                        if (funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant != null) {
                                            for (let servant = 0; servant < funcs[funcNo].reverse.basic.skill[skill].reverse.basic.servant.length; servant++) {
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
    for (let i = 0; i < effectCount; i++) {
        msgTitle += skillsToLookUp[i];
        if (i < effectCount - 1) {
            msgTitle += ", ";
        }
        else {
            msgTitle += "\n";
        }
    }
    let ids = [];
    for (let j = 0; j < skillToCEs[skillsToLookUp[0]].length; j++) {
        if (skillToCEs[skillsToLookUp[0]][j].collectionNo == 0) {
            continue;
        }
        //console.log("Checking CE Id: " + skillToCEs[skillsToLookUp[0]][j].collectionNo + " (" + (j + 1) + " of " + skillToCEs[skillsToLookUp[0]].length + ")");
        let addCE = true;
        for (let list = 1; list < effectCount; list++) {
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
    let strings = [""];
    let currentString = 0;
    if (ids.length > 0) {
        for (let k = 0; k < ids.length; k++) {
            let addition = "[" + ids[k] + "](https://apps.atlasacademy.io/db/#/JP/craft-essence/" + ids[k] + "), ";
            if (strings[currentString].length + addition.length < 2048) {
                strings[currentString] += addition;
            }
            else {
                currentString++;
                strings[currentString] = addition;
            }
        }
        strings[currentString] = strings[currentString].substring(0, strings[currentString].length - 2);

        chatMsg.channel.send({
            embed: {
                title: msgTitle,
                description: strings[0]
            }
        });
        for (let m = 1; m < strings.length; m++) {
            chatMsg.channel.send({
                embed: {
                    description: strings[m]
                }
            });
        }
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
    for (let i = 0; i < list.length; i++) {
        if (checkIdsEqual(list[i], ce)) {
            return true;
        }
    }
    return false;
}

function listEnumsDirty(msg) {
    let strings = [""];
    let currentString = 0;
    for (let b = 0; b < buffsEnum.length; b++) {
        if (strings[currentString].length + buffsEnum[b].length + 2 < 2048) {
            strings[currentString] += buffsEnum[b] + ", ";
        }
        else {
            currentString++;
            strings[currentString] = buffsEnum[b] + ", ";
        }
    }
    for (let f = 0; f < functionsNotBuffs.length; f++) {
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
    for (let m = 1; m < strings.length; m++) {
        msg.channel.send({
            embed: {
                description: strings[m]
            }
        });
    }
}

function listEnums(msg, page) {
    let page1 = "**Command Cards:**\n<:_artsCard:745829689511116931><:_busterCard:745829693055434855><:_quickCard:745829693390848025> __Arts/Buster/Quick__ (disambiguation coming soon:tm:) - upCommandall, downCommandall\n**ATK & DEF:**\n<:_charisma:745829692627746940><:_atkDown:745829689553059860> __Attack__ - upAtk, downAtk\n<:_divinity:745829692996583424> __Divinity__ - addDamage, subDamage\n<:_defUp:745829691864252539><:_defDown:746544362174808175> __Defense__ - upDefence, downDefence; __Damage Cut__ - addSelfdamage, subSelfdamage\n<:_ignoreDefense:749034353492754462> __Ignore Defense__ - pierceDefence\n<:_powermod:745829692246065174> __Damage VS Statused__ - upDamageIndividualityActiveonly, downDamageIndividualityActiveonly\n**HP:**\n<:_HoT:745829691876704327> __Per Turn__ - regainHp, reduceHp\n<:_healPower:745829692145139732> __Healing Received__ - upGainHp, downGainHp; __Healing Given__ upGivegainHp, downGivegainHp\n<:_HPUp:745829692065447944> __Max HP__ - addMaxhp, subMaxhp\n**NP:** \n<:_npCharge:745829692556312628> __Starting NP__ - gainNp, lossNp\n<:_npgenUp:745829691859927053> __NP Gen__ - upDropnp, downDropnp\n<:_attackednpgenUp:749036878505967789> __NP Gen when Attacked__ - upDamagedropnp, downDamagedropnp\n<:_npmod:745829692229025833><:_npmodDown:745829692136882218> __NP Damage__ - upNpdamage, downNpdamage\n<:_npchargePerTurn:745829692002664449> __Per Turn__ - regainNp, reduceNp\n<:_overcharge:745829693319544852> __Overcharge__ - upChagetd\n**Critical:**\n<:_critUp:745829691922972773><:_critDown:745829691922841670> __Crit Damage__ - upCriticaldamage, downCriticaldamage\n<:_starGen:749038774226518148> __Star Gen__ - upCriticalpoint, downCriticalpoint\n<:_gatherUp:745829692191277116><:_gatherDown:745829692287877162> __Weight__ - upStarweight, downStarweight\n<:_starsPerTurn:745829692233220217> __Per Turn__ - regainStar\n<:_critChanceResUp:749039937378320384> __Chance of Taking Critical Hit__ - upCriticalRateDamageTaken, downCriticalRateDamageTaken";
    let page2 = "**Lifelines:**\n<:_evade:745829692019441745> __Evade__ - avoidance\n<:_sureHit:745829692702982265> __Sure Hit__ - breakAvoidance\n<:_invul:745829692254322698> __Invincible__ - invincible\n<:_invulPierce:745829691914715236> __Pierce Invincible__ - pierceInvincible\n<:_guts:745829692212248648> __Revive with X HP__ - guts, __Revive with %__ - gutsRatio\n<:_taunt:745829692665495623> __Taunt__ - upHate\n**Buffs:**\n<:_debuffResist:745829691780235345> __Debuff Resist__ - upTolerance, downTolerance\n<:_debuffImmunity:749042763386847242> __Debuff Immunity__ - avoidState\n<:_debuffSuccessUp:745829691847606355> __Debuff Success__ - upGrantstate, downGrantstate\n<:_removalResistUp:749043292246900757> __Buff Clear Resist__ - upToleranceSubstate, downToleranceSubstate\n<:_spooky:745829692522758234> __Instant Kill Resist__ - upResistInstantdeath, upNonresistInstantdeath\n<:_deathImmunity:749043976799125524> __Instant Kill Immunity__ - avoidInstantdeath\n<:_deathRateUp:745829691948007484> __Instant Kill Success__ - upGrantInstantdeath, downGrantInstantdeath\n<:_trait:749044864271777863> __Class Interaction__ - overwriteClassRelation\n<:shikidab:683126631161921651> *AFAIK any Buff?* - addState, subState\n**Triggers:**\n<:_deadLater:745829691616919643> __Trigger On Death__ - deadFunction\n<:_triggerOnAtk:749045645582532648> __Trigger On Card Use__ - commandattackFunction\n<:landingBB:703789977133121798> __Trigger On Enter Battle__ - entryFunction\n**Rewards:**\n<:_journey:749046505377234975> __Master XP__ - expUp; __Clothes XP__ - userEquipExpUp\n<:_qpUp:749046505674899466> __QP +X__ - qpUp, __QP +%__ - qpDropUp\n<:_bond:745829691457405030> __Bond__ - servantFriendshipUp\n<:_friendshipPoint:749046995074809856> __FP from Taking__ - friendPointUp, __FP +X__ - friendPointUpDuplicate";
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
    for (let t = 0; t < args.length; t++) {
        if (t > 0) {
            tittle += " OR ";
        }
        tittle += args[t];
    }

    let strings = [""];
    let currentString = 0;
    for (let b = 0; b < buffsEnum.length; b++) {
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
    for (let f = 0; f < functionsNotBuffs.length; f++) {
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
    for (let m = 1; m < strings.length; m++) {
        msg.channel.send({
            embed: {
                description: strings[m]
            }
        });
    }
}

function containsToLower(list, string) {
    for (let l = 0; l < list.length; l++) {
        //console.log("Testing if " + list[l] + " contains " + string);
        if (string.toLowerCase().includes(list[l].toLowerCase())) {
            return true;
        }
    }
    return false;
}

function getContentsToLower(list, string) {
    for (let l = 0; l < list.length; l++) {
        //console.log("Testing if " + list[l] + " == " + string);
        if (string.toLowerCase() == list[l].toLowerCase()) {
            return list[l];
        }
    }
    return "";
}