"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("bdsx/command");
const blockpos_1 = require("bdsx/bds/blockpos");
const event_1 = require("bdsx/event");
const launcher_1 = require("bdsx/launcher");
const actor_1 = require("bdsx/bds/actor");
const nativetype_1 = require("bdsx/nativetype");
const fs_1 = require("fs");
const form_1 = require("bdsx/bds/form");
const server_1 = require("bdsx/bds/server");
const perms = require("./perms.json");
require("fs");
require("bdsx/launcher");
const dbFile = "areaCommand.json";
class PlayerListDB extends Array {
    constructor(items) {
        super(...items);
    }
    static create() {
        return Object.create(PlayerListDB.prototype);
    }
    addPlayer(playerName, cmdArea) {
        let xuid = playerName.getNetworkIdentifier();
        let playerEntry = new PLPlayerEntry(playerName.getName(), xuid, cmdArea);
        this.push(playerEntry);
        return this;
    }
    getPlayer(playerName) {
        let xuid = playerName.getNetworkIdentifier();
        let object = this.find((obj) => obj.xuid == xuid);
        if (object != undefined) {
            let index = this.indexOf(object);
            let playerEntry = Object.create(PLPlayerEntry.prototype);
            return this[index] = Object.assign(playerEntry, object);
        }
        else {
            return undefined;
        }
    }
}
class PLPlayerEntry {
    constructor(name, xuid, cmdArea) {
        this.name = name;
        this.xuid = xuid;
        this.cmdArea = [];
        if (cmdArea != undefined) {
            this.cmdArea.push(cmdArea);
        }
    }
    addPLArea(areaName, bool, first = false) {
        let areaEntry = new PLAreaEntry(areaName, bool);
        if (first == true) {
            this.cmdArea.unshift(areaEntry);
        }
        else {
            this.cmdArea.push(areaEntry);
        }
        return this;
    }
    delPLArea(areaName) {
        let object = this.cmdArea.find((obj) => obj.name == areaName);
        if (object != undefined) {
            let index = this.cmdArea.indexOf(object);
            this.cmdArea.splice(index, 1);
        }
        return this;
    }
    getPLArea(areaName) {
        let object = this.cmdArea.find((obj) => obj.name == areaName);
        if (object != undefined) {
            let index = this.cmdArea.indexOf(object);
            let areaEntry = Object.create(PLAreaEntry.prototype);
            return this.cmdArea[index] = Object.assign(areaEntry, object);
        }
        else {
            return undefined;
        }
    }
}
class PLAreaEntry {
    constructor(areaName, toggle) {
        this.name = areaName;
        this.bool = toggle;
    }
    rename(newName) {
        this.name = newName;
        return this;
    }
}
class AreaCommandDB extends Array {
    constructor(area) {
        super();
        this.area = [];
        if (area != undefined) {
            this.push(area);
        }
    }
    static create() {
        return Object.create(AreaCommandDB.prototype);
    }
    addArea(areaName, pos1, pos2, dimension, on_inside, first = false) {
        let areaEntry = new ACAreaEntry(areaName, dimension, pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z, "", on_inside, "");
        if (first == true) {
            this.unshift(areaEntry);
        }
        else {
            this.push(areaEntry);
        }
        return this;
    }
    delArea(areaName) {
        let object = this.find((obj) => obj.name == areaName);
        if (object != undefined) {
            let index = this.indexOf(object);
            this.splice(index, 1);
        }
        return this;
    }
    getArea(areaName) {
        let object = this.find((obj) => obj.name == areaName);
        if (object != undefined) {
            let index = this.indexOf(object);
            let areaEntry = Object.create(ACAreaEntry.prototype);
            return this[index] = Object.assign(areaEntry, object);
        }
        else {
            return undefined;
        }
    }
}
class ACAreaEntry {
    constructor(areaName, dimensionId, x1Pos, y1Pos, z1Pos, x2Pos, y2Pos, z2Pos, enter_cmd, inside_cmd, exit_cmd) {
        this.name = areaName;
        this.dimId = dimensionId;
        this.x1 = x1Pos;
        this.y1 = y1Pos;
        this.z1 = z1Pos;
        this.x2 = x2Pos;
        this.y2 = y2Pos;
        this.z2 = z2Pos;
        this.on_enter = enter_cmd;
        this.on_inside = inside_cmd;
        this.on_exit = exit_cmd;
    }
    rename(newName) {
        this.name = newName;
        return this;
    }
    edit_On_Enter(on_Enter_CMD) {
        this.on_enter = on_Enter_CMD;
        return this;
    }
    edit_On_Inside(on_Inside_CMD) {
        this.on_inside = on_Inside_CMD;
        return this;
    }
    edit_On_Exit(On_Exit_CMD) {
        this.on_exit = On_Exit_CMD;
        return this;
    }
}
/*
Functions
*/
function saveToFile(dbObject = areaDB, file = dbFile) {
    let filedata = JSON.stringify(dbObject, null, 4);
    fs_1.writeFileSync(file, filedata, 'utf8');
    console.log('[AREA COMMANDS] Database ' + dbFile + ' SAVED');
}
function loadFromFile(dbObject = areaDB, file = dbFile) {
    try {
        let filedata = fs_1.readFileSync(file, 'utf8');
        dbObject = Object.assign(dbObject, JSON.parse(filedata));
        console.log('[AREA COMMANDS] Database ' + dbFile + ' LOADED');
    }
    catch (err) {
        console.log('[AREA COMMANDS]' + file + ' DOES NOT EXIST');
        // console.log(err);
    }
}
function areaAdd(playerActor, areaName, pos1, pos2, dimensionID, areaCommand) {
    if (playerActor) {
        if (areaDB.getArea(areaName) == undefined) {
            if (areaName) {
                areaDB.addArea(areaName, pos1, pos2, dimensionID, areaCommand);
            }
            areaMsg(playerActor, `§eSet §3§o${areaName}§r§e`
                + `\n    [§f${dimensionID} §e@ §4${pos1.x.toFixed(1)} §a${pos1.y.toFixed(1)} §9${pos1.z.toFixed(1)} §- §4${pos2.x.toFixed(1)} §a${pos2.y.toFixed(1)} §9${pos2.z.toFixed(1)}§e] \n
                With Command "${areaCommand}"`);
            // console.log(areaDB.getArea(areaName).cmd);
        }
        else {
            let areaEntry = areaDB.getArea(areaName);
            if (areaEntry) {
                areaMsg(playerActor, `§eExisting §3§o${areaEntry.name}§r§e`
                    + `\n    [§f${actor_1.DimensionId[areaEntry.dimId]} §e@ §4${areaEntry.x1.toFixed(1)} §a${areaEntry.y1.toFixed(1)} §9${areaEntry.z1.toFixed(1)} §- §4${areaEntry.x2.toFixed(1)} §a${areaEntry.y2.toFixed(1)} §9${areaEntry.z2.toFixed(1)}§e]`
                    + `\n§r§cOverwriting §3§o${areaName}§r§e`
                    + `\n    [§f${dimensionID} §e@ §4${pos1.x.toFixed(1)} §a${pos1.y.toFixed(1)} §9${pos1.z.toFixed(1)} §- §4${pos2.x.toFixed(1)} §a${pos2.y.toFixed(1)} §9${pos2.z.toFixed(1)}§e]`);
                areaEntry.x1 = pos1.x;
                areaEntry.y1 = pos1.y;
                areaEntry.z1 = pos1.z;
                areaEntry.x2 = pos2.x;
                areaEntry.y2 = pos2.y;
                areaEntry.z2 = pos2.z;
                areaEntry.dimId = dimensionID;
                areaEntry.on_inside = areaCommand;
                // console.log(areaDB.getArea(areaName).on_inside);
            }
        }
        saveToFile();
    }
    else {
        console.log('[AREA COMMAND] Error: No Player for areaAdd()');
    }
}
function areaEdit(playerActor, areaName, newAreaName = areaName, on_enter, on_inside = "", on_exit) {
    const areaEntry = areaDB.getArea(areaName);
    if (playerActor) {
        let playerNetID = playerActor.getNetworkIdentifier();
        let editConfirmForm = new form_1.ModalForm('§0§l! - ! - ! - [COMMAND LIST] - ! - ! - !', `Are you sure you want to §9§lEDIT§r:\n\n§3§o${areaName}§r ?`);
        editConfirmForm.setButtonCancel("§lCANCEL");
        editConfirmForm.setButtonConfirm("§9§lEDIT");
        if (playerActor.isPlayer() == true) {
            if (areaEntry) {
                if (newAreaName != areaName) {
                    if (areaEntry.on_enter != on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit != on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Enter(on_enter);
                                areaEntry.edit_On_Inside(on_inside);
                                areaEntry.edit_On_Exit(on_exit);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                    else if (areaEntry.on_enter != on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit == on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Enter(on_enter);
                                areaEntry.edit_On_Inside(on_inside);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                    else if (areaEntry.on_enter != on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit != on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Enter(on_enter);
                                areaEntry.edit_On_Exit(on_exit);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                    else if (areaEntry.on_enter == on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit != on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Inside(on_inside);
                                areaEntry.edit_On_Exit(on_exit);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                    else if (areaEntry.on_enter != on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit == on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Enter(on_enter);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                    else if (areaEntry.on_enter == on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit == on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Inside(on_inside);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                    else if (areaEntry.on_enter == on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit != on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Exit(on_exit);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                    else if (areaEntry.on_enter == on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit == on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                }
                else if (areaEntry.on_enter != on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit != on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Enter(on_enter);
                            areaEntry.edit_On_Inside(on_inside);
                            areaEntry.edit_On_Exit(on_exit);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                }
                else if (areaEntry.on_enter != on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit == on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Enter(on_enter);
                            areaEntry.edit_On_Inside(on_inside);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                }
                else if (areaEntry.on_enter != on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit != on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Enter(on_enter);
                            areaEntry.edit_On_Exit(on_exit);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                }
                else if (areaEntry.on_enter == on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit != on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Inside(on_inside);
                            areaEntry.edit_On_Exit(on_exit);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                }
                else if (areaEntry.on_enter != on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit == on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Enter(on_enter);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                }
                else if (areaEntry.on_enter == on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit == on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Inside(on_inside);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                }
                else if (areaEntry.on_enter == on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit != on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Exit(on_exit);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                }
            }
            else {
                areaMsg(playerActor, `§eNo warp called: §3§o${areaName}`);
            }
        }
        else {
            console.log('[WARP LIST] Error: No Player for areaEdit()');
        }
    }
}
function deleteArea(playerActor, areaName) {
    const areaEntry = areaDB.getArea(areaName);
    if (playerActor) {
        let playerNetID = playerActor.getNetworkIdentifier();
        let deleteConfirmForm = new form_1.ModalForm('§0§l! - ! - ! - [COMMAND LIST] - ! - ! - !', `Are you sure you want to §9§lDELETE§r:\n\n§3§o${areaName}§r ?`);
        deleteConfirmForm.setButtonCancel("§lCANCEL");
        deleteConfirmForm.setButtonConfirm("§9§lDELETE");
        if (playerActor.isPlayer() == true) {
            if (areaEntry != undefined) {
                deleteConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                    if (data.response !== undefined && data.response !== null && data.response !== false) {
                        areaDB.delArea(areaEntry.name);
                        areaMsg(playerActor, `§eDeleted §3§o${areaEntry.name}§r§e`
                            + `\n    [§f${actor_1.DimensionId[areaEntry.dimId]}§e]`);
                        saveToFile();
                    }
                });
            }
        }
    }
}
function tellRaw(playerName, text) {
    launcher_1.bedrockServer.executeCommand(`/tellraw ${playerName} {"rawtext":[{"text":"${text}"}]}`);
}
function areaMsg(playerActor, text) {
    let playerName = playerActor.getName();
    if (playerName != undefined) {
        tellRaw(playerName, '§e§l[AREA COMMAND]');
        tellRaw(playerName, text);
        tellRaw(playerName, '§e§l* * * * * * *');
    }
    else {
        console.log('[AREA COMMAND] Error: No Player Name for areaMsg()');
    }
}
/*
Load DB
*/
let areaDB = AreaCommandDB.create();
let playerlistDB = PlayerListDB.create();
loadFromFile();
/*
Save DB
*/
event_1.events.serverClose.on(() => {
    saveToFile();
});
/*
Commands
*/
command_1.command.register("cmdareacreate", "Creates an area that will run a command on all entities inside", perms.createarea).overload((param, origin, _output) => {
    let cmdPos = origin.getWorldPosition();
    let pos1 = new blockpos_1.Vec3(true);
    let pos2 = new blockpos_1.Vec3(true);
    if (param.x1.is_relative == true) {
        pos1.x = Math.round(cmdPos.x) + Math.round(param.x1.value);
    }
    else {
        pos1.x = Math.round(param.x1.value);
    }
    if (param.y1.is_relative == true) {
        pos1.y = Math.round(cmdPos.y) + Math.round(param.y1.value);
    }
    else {
        pos1.y = Math.round(param.y1.value);
    }
    if (param.z1.is_relative == true) {
        pos1.z = Math.round(cmdPos.z) + Math.round(param.z1.value);
    }
    else {
        pos1.z = Math.round(param.z1.value);
    }
    if (param.x2.is_relative == true) {
        pos2.x = Math.round(cmdPos.x) + Math.round(param.x2.value);
    }
    else {
        pos2.x = Math.round(param.x2.value);
    }
    if (param.y2.is_relative == true) {
        pos2.y = Math.round(cmdPos.y) + Math.round(param.y2.value);
    }
    else {
        pos2.y = Math.round(param.y2.value);
    }
    if (param.z2.is_relative == true) {
        pos2.z = Math.round(cmdPos.z) + Math.round(param.z2.value);
    }
    else {
        pos2.z = Math.round(param.z2.value);
    }
    if (origin.getName() && origin.getName() != '!Â§r') {
        let playerActor = origin.getEntity();
        let dimId;
        if (playerActor) {
            dimId = playerActor.getDimensionId();
            if (param.DimensionId) {
                dimId = param.DimensionId;
            }
            areaAdd(playerActor, param.areaName, pos1, pos2, dimId, param.on_inside);
        }
    }
    // launcher_1.bedrockServer.executeCommandOnConsole(`execute ${playerName} ~ ~ ~ say cmdarea success!`);
    return 0;
}, {
    x1: blockpos_1.RelativeFloat,
    y1: blockpos_1.RelativeFloat,
    z1: blockpos_1.RelativeFloat,
    x2: blockpos_1.RelativeFloat,
    y2: blockpos_1.RelativeFloat,
    z2: blockpos_1.RelativeFloat,
    areaName: nativetype_1.CxxString,
    on_inside: nativetype_1.CxxString,
    DimensionId: [nativetype_1.int32_t, true]
});
command_1.command.register("cmdarealist", "Edit your Command Areas", perms.editarea).overload((param, origin, _output) => {
    var _a;
    if (origin.getName() != undefined && origin.getName() != '!Â§r') {
        let playerNetID = (_a = origin.getEntity()) === null || _a === void 0 ? void 0 : _a.getNetworkIdentifier();
        if (playerNetID) {
            let playerActor = playerNetID.getActor();
            if (playerActor != null) {
                if (areaDB.length > 0) {
                    let areaListForm = new form_1.SimpleForm('§0§l[COMMAND LIST]');
                    for (let i = 0; i < areaDB.length; i++) {
                        areaListForm.addButton(new form_1.FormButton(`§1§o${areaDB[i].name}§r§8`
                            + `\n[§0${actor_1.DimensionId[areaDB[i].dimId]}§8]`));
                    }
                    areaListForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null) {
                            let areaIndex = data.response;
                            const areaEntry = areaDB === null || areaDB === void 0 ? void 0 : areaDB.getArea(areaDB[areaIndex].name);
                            if (areaEntry) {
                                if (areaDB[areaIndex]) {
                                    let indexArray = [];
                                    for (let i = 0; i < areaDB.length; i++) {
                                        indexArray.push(`${i + 1}`);
                                    }
                                    let areaItemForm = new form_1.CustomForm('§0§l[COMMAND LIST]');
                                    areaItemForm.addComponent(new form_1.FormInput("§7§oName:", `${areaEntry.name}`, `${areaEntry.name}`));
                                    areaItemForm.addComponent(new form_1.FormInput("§7§oOn_Enter:", `${areaEntry.on_enter}`, `${areaEntry.on_enter}`));
                                    areaItemForm.addComponent(new form_1.FormInput("§7§oOn_Inside:", `${areaEntry.on_inside}`, `${areaEntry.on_inside}`));
                                    areaItemForm.addComponent(new form_1.FormInput("§7§oOn_Exit:", `${areaEntry.on_exit}`, `${areaEntry.on_exit}`));
                                    areaItemForm.sendTo(playerNetID, (data, playerNetID) => {
                                        if (data.response !== undefined && data.response !== null) {
                                            console.log(data.response);
                                            areaEdit(playerActor, areaEntry.name, data.response[0], data.response[1], data.response[2], data.response[3]);
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
            }
            else {
                areaMsg(playerActor, '§c0 §gWarp points set');
            }
        }
    }
    return 0;
}, {});
command_1.command.register("cmdareadelete", "Delete a Command Area", perms.delarea).overload((param, origin, _outpur) => {
    var _a;
    if (origin.getName() != undefined && origin.getName() != '!Â§r') {
        let playerNetID = (_a = origin.getEntity()) === null || _a === void 0 ? void 0 : _a.getNetworkIdentifier();
        if (playerNetID) {
            let playerActor = playerNetID.getActor();
            if (playerActor != null) {
                deleteArea(playerActor, param.areaName);
            }
        }
    }
}, {
    areaName: nativetype_1.CxxString
});
/*
Run Commands
*/
event_1.events.serverUpdate.on(() => {
    for (const i in areaDB) {
        let areaData = areaDB[i];
        let pos1 = blockpos_1.Vec3.create(0, 0, 0);
        let pos2 = blockpos_1.Vec3.create(0, 0, 0);
        if (areaData.x1.toFixed(1) <= areaData.x2.toFixed(1)) {
            pos1.x = areaData.x1.toFixed(1);
            pos2.x = areaData.x2.toFixed(1);
        }
        else {
            pos1.x = areaData.x2.toFixed(1);
            pos2.x = areaData.x1.toFixed(1);
        }
        if (areaData.y1.toFixed(1) <= areaData.y2.toFixed(1)) {
            pos1.y = areaData.y1.toFixed(1);
            pos2.y = areaData.y2.toFixed(1);
        }
        else {
            pos1.y = areaData.y2.toFixed(1);
            pos2.y = areaData.y1.toFixed(1);
        }
        if (areaData.z1.toFixed(1) <= areaData.z2.toFixed(1)) {
            pos1.z = areaData.z1.toFixed(1);
            pos2.z = areaData.z2.toFixed(1);
        }
        else {
            pos1.z = areaData.z2.toFixed(1);
            pos2.z = areaData.z1.toFixed(1);
        }
        for (let i = 0; i < server_1.serverInstance.minecraft.getLevel().players.size(); i++) {
            let playerNetID = server_1.serverInstance.minecraft.getLevel().players.get(i).getNetworkIdentifier();
            let playerActor = playerNetID.getActor();
            if (playerActor) {
                let curPos = playerActor.getPosition();
                let dimId = playerActor.getDimensionId();
                let playerName = playerActor.getName();
                // console.log("Searching Player");
                if (((pos1.x.toFixed(1) <= curPos.x.toFixed(1) && curPos.x.toFixed(1) <= pos2.x.toFixed(1)) && (pos1.y.toFixed(1) <= curPos.y.toFixed(1) && curPos.y.toFixed(1) <= pos2.y.toFixed(1)) && (pos1.z.toFixed(1) <= curPos.z.toFixed(1) && curPos.z.toFixed(1) <= pos2.z.toFixed(1)))) {
                    if (dimId == areaData.dimId) {
                        // console.log("Player in the area!");
                        let plPlayer = playerlistDB.getPlayer(playerActor);
                        if (plPlayer == undefined) {
                            playerlistDB.addPlayer(playerActor, null);
                            plPlayer = playerlistDB.getPlayer(playerActor);
                            // console.log("Player Added to list");
                        }
                        if (plPlayer != undefined) {
                            let plEntry = plPlayer.getPLArea(areaData.name);
                            if (plEntry != undefined) {
                                // console.log("Player Entry shows: " + areaData.name + ", " + plEntry.bool);
                                if (plEntry.bool) {
                                    if (areaData.on_inside != "") {
                                        launcher_1.bedrockServer.executeCommand(`/execute "${playerName}" ~ ~ ~ ` + areaData.on_inside, true, 3);
                                    }
                                }
                            }
                            else {
                                // console.log("Player has just entered: " + areaData.name);
                                plPlayer.addPLArea(areaData.name, true);
                                if (areaData.on_enter != "") {
                                    launcher_1.bedrockServer.executeCommand(`/execute "${playerName}" ~ ~ ~ ` + areaData.on_enter, true, 3);
                                }
                            }
                        }
                    }
                }
                else {
                    let plPlayer = playerlistDB.getPlayer(playerActor);
                    if (plPlayer != undefined) {
                        if (plPlayer.getPLArea(areaData.name) != undefined) {
                            plPlayer.delPLArea(areaData.name);
                            // console.log("Player has just left: " + areaData.name);
                            if (areaData.on_exit != "") {
                                launcher_1.bedrockServer.executeCommand(`/execute "${playerName}" ~ ~ ~ ` + areaData.on_exit, true, 3);
                            }
                        }
                    }
                }
                // console.log("Search Complete");
            }
        }
        // console.log(/execute @a[x=${x},dx=${xD},y=${y},dy=${yD},z=${z},dz=${zD}] ~ ~ ~ ` + areaData.cmd);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJlYUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXJlYUNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMENBQXVDO0FBQ3ZDLGdEQUF3RDtBQUN4RCxzQ0FBb0M7QUFDcEMsNENBQThDO0FBQzlDLDBDQUFvRDtBQUNwRCxnREFBcUQ7QUFDckQsMkJBQWlEO0FBRWpELHdDQUF5RjtBQUN6Riw0Q0FBaUQ7QUFDakQsc0NBQXVDO0FBQ3ZDLGNBQVk7QUFDWix5QkFBdUI7QUFFdkIsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUM7QUFFbEMsTUFBTSxZQUFhLFNBQVEsS0FBSztJQUM1QixZQUFZLEtBQVU7UUFDbEIsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUNELE1BQU0sQ0FBQyxNQUFNO1FBQ1QsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQ0QsU0FBUyxDQUFDLFVBQWlCLEVBQUUsT0FBWTtRQUNyQyxJQUFJLElBQUksR0FBRyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM3QyxJQUFJLFdBQVcsR0FBRyxJQUFJLGFBQWEsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUNELFNBQVMsQ0FBQyxVQUFpQjtRQUN2QixJQUFJLElBQUksR0FBRyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM3QyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO1FBQ2xELElBQUksTUFBTSxJQUFJLFNB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Q0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDOUQ7U0FDSTtRQUNELElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3ZDO0lBQ0QsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUU7UUFDOUIsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDOUQ7U0FDSTtRQUNELElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3ZDO0lBQ0QsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUU7UUFDOUIsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDOUQ7U0FDSTtRQUNELElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3ZDO0lBQ0QsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUU7UUFDOUIsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDOUQ7U0FDSTtRQUNELElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUss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