import { command } from "bdsx/command";
import { RelativeFloat, Vec3 } from "bdsx/bds/blockpos";
import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { Actor, DimensionId } from "bdsx/bds/actor";
import { CxxString, int32_t } from "bdsx/nativetype";
import { readFileSync, writeFileSync } from "fs";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { CustomForm, FormButton, FormInput, ModalForm, SimpleForm } from "bdsx/bds/form";
import { serverInstance } from "bdsx/bds/server";
import perms = require("./perms.json");
import "fs";
import "bdsx/launcher";

const dbFile = "areaCommand.json";

class PlayerListDB extends Array {
    constructor(items: any) {
        super(...items);
    }
    static create() {
        return Object.create(PlayerListDB.prototype);
    }
    addPlayer(playerName: Actor, cmdArea: any) {
        let xuid = playerName.getNetworkIdentifier();
        let playerEntry = new PLPlayerEntry(playerName.getName(), xuid, cmdArea);
        this.push(playerEntry);
        return this;
    }
    getPlayer(playerName: Actor) {
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
    name: any;
    xuid: any;
    cmdArea;
    constructor(name: any, xuid: any, cmdArea: any) {
        this.name = name;
        this.xuid = xuid;
        this.cmdArea = [];
        if (cmdArea != undefined) {
            this.cmdArea.push(cmdArea);
        }
    }
    addPLArea(areaName: string, bool: boolean, first = false) {
        let areaEntry = new PLAreaEntry(areaName, bool);
        if (first == true) {
            this.cmdArea.unshift(areaEntry);
        }
        else {
            this.cmdArea.push(areaEntry);
        }
        return this;
    }
    delPLArea(areaName: string) {
        let object = this.cmdArea.find((obj) => obj.name == areaName);
        if (object != undefined) {
            let index = this.cmdArea.indexOf(object);
            this.cmdArea.splice(index, 1);
        }
        return this;
    }
    getPLArea(areaName: string): PLAreaEntry | undefined {
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
    name: string;
    bool: boolean;
    constructor(areaName: string, toggle: boolean) {
        this.name = areaName;
        this.bool = toggle;
    }
    rename(newName: any) {
        this.name = newName;
        return this;
    }
}

class AreaCommandDB extends Array {
    area: never[];
    constructor(area: undefined) {
        super();
        this.area = [];
        if (area != undefined) {
            this.push(area);
        }
    }

    static create() {
        return Object.create(AreaCommandDB.prototype);
    }

    addArea(areaName: string, pos1: { x: number; y: number; z: number; }, pos2: { x: number; y: number; z: number; }, dimension: DimensionId, on_inside: string, first = false) {
        let areaEntry = new ACAreaEntry(areaName, dimension, pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z, "", on_inside, "");
        if (first == true) {
            this.unshift(areaEntry);
        }
        else {
            this.push(areaEntry);
        }
        return this;
    }
    delArea(areaName: string) {
        let object = this.find((obj) => obj.name == areaName);
        if (object != undefined) {
            let index = this.indexOf(object);
            this.splice(index, 1);
        }
        return this;
    }
    getArea(areaName: string): ACAreaEntry | undefined {
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
    name: string;
    dimId: DimensionId;
    x1: number;
    y1: number;
    z1: number;
    x2: number;
    y2: number;
    z2: number;
    on_enter: string;
    on_inside: string;
    on_exit: string;
    constructor(areaName: string, dimensionId: DimensionId, x1Pos: number, y1Pos: number, z1Pos: number, x2Pos: number, y2Pos: number, z2Pos: number, enter_cmd: string, inside_cmd: string, exit_cmd: string) {
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
    rename(newName: string) {
        this.name = newName;
        return this;
    }

    edit_On_Enter(on_Enter_CMD: string) {
        this.on_enter = on_Enter_CMD;
        return this;
    }

    edit_On_Inside(on_Inside_CMD: string) {
        this.on_inside = on_Inside_CMD;
        return this;
    }

    edit_On_Exit(On_Exit_CMD: string) {
        this.on_exit = On_Exit_CMD;
        return this;
    }
}

/*
Functions
*/
function saveToFile(dbObject = areaDB, file = dbFile) {
    let filedata = JSON.stringify(dbObject, null, 4);
    writeFileSync(file, filedata, 'utf8');
    console.log('[AREA COMMANDS] Database ' + dbFile + ' SAVED');
}
function loadFromFile(dbObject = areaDB, file = dbFile) {
    try {
        let filedata = readFileSync(file, 'utf8');
        dbObject = Object.assign(dbObject, JSON.parse(filedata));
        console.log('[AREA COMMANDS] Database ' + dbFile + ' LOADED');
    }
    catch (err) {
        console.log('[AREA COMMANDS]' + file + ' DOES NOT EXIST');
        // console.log(err);
    }
}
function areaAdd(playerActor: Actor | null, areaName: any, pos1: { x: number; y: number; z: number; }, pos2: { x: number; y: number; z: number; }, dimensionID: DimensionId, areaCommand: any) {
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
                    + `\n    [§f${DimensionId[areaEntry.dimId]} §e@ §4${areaEntry.x1.toFixed(1)} §a${areaEntry.y1.toFixed(1)} §9${areaEntry.z1.toFixed(1)} §- §4${areaEntry.x2.toFixed(1)} §a${areaEntry.y2.toFixed(1)} §9${areaEntry.z2.toFixed(1)}§e]`
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

function areaEdit(playerActor: Actor | null, areaName: string, newAreaName = areaName, on_enter: string, on_inside = "", on_exit: string) {
    const areaEntry = areaDB.getArea(areaName);
    if (playerActor) {
        let playerNetID = playerActor.getNetworkIdentifier();
        let editConfirmForm = new ModalForm('§0§l! - ! - ! - [COMMAND LIST] - ! - ! - !', `Are you sure you want to §9§lEDIT§r:\n\n§3§o${areaName}§r ?`);
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
                    } else if (areaEntry.on_enter != on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit == on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Enter(on_enter);
                                areaEntry.edit_On_Inside(on_inside);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    } else if (areaEntry.on_enter != on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit != on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Enter(on_enter);
                                areaEntry.edit_On_Exit(on_exit);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    } else if (areaEntry.on_enter == on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit != on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Inside(on_inside);
                                areaEntry.edit_On_Exit(on_exit);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    } else if (areaEntry.on_enter != on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit == on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Enter(on_enter);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    } else if (areaEntry.on_enter == on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit == on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Inside(on_inside);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    } else if (areaEntry.on_enter == on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit != on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaEntry.edit_On_Exit(on_exit);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    } else if (areaEntry.on_enter == on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit == on_exit) {
                        editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                            if (data.response !== undefined && data.response !== null && data.response !== false) {
                                areaEntry.rename(newAreaName);
                                areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                                saveToFile();
                            }
                        });
                    }
                } else if (areaEntry.on_enter != on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit != on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Enter(on_enter);
                            areaEntry.edit_On_Inside(on_inside);
                            areaEntry.edit_On_Exit(on_exit);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                } else if (areaEntry.on_enter != on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit == on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Enter(on_enter);
                            areaEntry.edit_On_Inside(on_inside);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                } else if (areaEntry.on_enter != on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit != on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Enter(on_enter);
                            areaEntry.edit_On_Exit(on_exit);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                } else if (areaEntry.on_enter == on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit != on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Inside(on_inside);
                            areaEntry.edit_On_Exit(on_exit);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                } else if (areaEntry.on_enter != on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit == on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Enter(on_enter);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                } else if (areaEntry.on_enter == on_enter && areaEntry.on_inside != on_inside && areaEntry.on_exit == on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Inside(on_inside);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                } else if (areaEntry.on_enter == on_enter && areaEntry.on_inside == on_inside && areaEntry.on_exit != on_exit) {
                    editConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                        if (data.response !== undefined && data.response !== null && data.response !== false) {
                            areaEntry.edit_On_Exit(on_exit);
                            areaMsg(playerActor, `§3§o${areaName}§r§e now\n    §r§3§o${newAreaName} \n §1${on_enter} \n §2${on_inside} \n §a${on_exit}`);
                            saveToFile();
                        }
                    });
                }
            } else {
                areaMsg(playerActor, `§eNo warp called: §3§o${areaName}`);
            }

        }
        else {
            console.log('[WARP LIST] Error: No Player for areaEdit()');
        }
    }
}

function deleteArea(playerActor: Actor, areaName: string) {
    const areaEntry = areaDB.getArea(areaName);
    if (playerActor) {
        let playerNetID = playerActor.getNetworkIdentifier();
        let deleteConfirmForm = new ModalForm('§0§l! - ! - ! - [COMMAND LIST] - ! - ! - !', `Are you sure you want to §9§lDELETE§r:\n\n§3§o${areaName}§r ?`);
        deleteConfirmForm.setButtonCancel("§lCANCEL");
        deleteConfirmForm.setButtonConfirm("§9§lDELETE");
        if (playerActor.isPlayer() == true) {
            if (areaEntry != undefined) {
                deleteConfirmForm.sendTo(playerNetID, (data, playerNetID) => {
                    if (data.response !== undefined && data.response !== null && data.response !== false) {
                        areaDB.delArea(areaEntry.name);
                        areaMsg(playerActor, `§eDeleted §3§o${areaEntry.name}§r§e`
                            + `\n    [§f${DimensionId[areaEntry.dimId]}§e]`);
                        saveToFile();
                    }
                });
            }
        }
    }


}

function tellRaw(playerName: any, text: string) {
    bedrockServer.executeCommand(`/tellraw ${playerName} {"rawtext":[{"text":"${text}"}]}`);
}

function areaMsg(playerActor: any, text: string) {
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
let areaDB: AreaCommandDB = AreaCommandDB.create();
let playerlistDB: PlayerListDB = PlayerListDB.create();
loadFromFile();


/*
Save DB
*/
events.serverClose.on(() => {
    saveToFile();
});


/*
Commands
*/
command.register("cmdareacreate", "Creates an area that will run a command on all entities inside", perms.createarea).overload((param, origin, _output) => {
    let cmdPos = origin.getWorldPosition();
    let pos1 = new Vec3(true);
    let pos2 = new Vec3(true);
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
        let playerActor: Actor | null = origin.getEntity();
        let dimId: DimensionId
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
    x1: RelativeFloat,
    y1: RelativeFloat,
    z1: RelativeFloat,
    x2: RelativeFloat,
    y2: RelativeFloat,
    z2: RelativeFloat,
    areaName: CxxString,
    on_inside: CxxString,
    DimensionId: [int32_t, true]
});

command.register("cmdarealist", "Edit your Command Areas", perms.editarea).overload((param, origin, _output) => {
    if (origin.getName() != undefined && origin.getName() != '!Â§r') {
        let playerNetID: NetworkIdentifier | undefined = origin.getEntity()?.getNetworkIdentifier();
        if (playerNetID) {
            let playerActor: Actor | null = playerNetID.getActor();
            if (playerActor != null) {
                if (areaDB.length > 0) {
                    let areaListForm = new SimpleForm('§0§l[COMMAND LIST]');
                    for (let i = 0; i < areaDB.length; i++) {
                        areaListForm.addButton(new FormButton(`§1§o${areaDB[i].name}§r§8`
                            + `\n[§0${DimensionId[areaDB[i].dimId]}§8]`));
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
                                    let areaItemForm = new CustomForm('§0§l[COMMAND LIST]');
                                    areaItemForm.addComponent(new FormInput("§7§oName:", `${areaEntry.name}`, `${areaEntry.name}`));
                                    areaItemForm.addComponent(new FormInput("§7§oOn_Enter:", `${areaEntry.on_enter}`, `${areaEntry.on_enter}`));
                                    areaItemForm.addComponent(new FormInput("§7§oOn_Inside:", `${areaEntry.on_inside}`, `${areaEntry.on_inside}`));
                                    areaItemForm.addComponent(new FormInput("§7§oOn_Exit:", `${areaEntry.on_exit}`, `${areaEntry.on_exit}`));
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
}, {})

command.register("cmdareadelete", "Delete a Command Area", perms.delarea).overload((param, origin, _outpur) => {
    if (origin.getName() != undefined && origin.getName() != '!Â§r') {
        let playerNetID: NetworkIdentifier | undefined = origin.getEntity()?.getNetworkIdentifier();
        if (playerNetID) {
            let playerActor: Actor | null = playerNetID.getActor();
            if (playerActor != null) {
                deleteArea(playerActor, param.areaName)
            }
        }
    }
}, {
    areaName: CxxString
});

/*
Run Commands
*/
events.serverUpdate.on(() => {
    for (const i in areaDB) {
        let areaData = areaDB[i];
        let pos1: Vec3 = Vec3.create(0, 0, 0);
        let pos2: Vec3 = Vec3.create(0, 0, 0);

        if (areaData.x1.toFixed(1) <= areaData.x2.toFixed(1)) {
            pos1.x = areaData.x1.toFixed(1);
            pos2.x = areaData.x2.toFixed(1);
        } else {
            pos1.x = areaData.x2.toFixed(1);
            pos2.x = areaData.x1.toFixed(1);
        }
        if (areaData.y1.toFixed(1) <= areaData.y2.toFixed(1)) {
            pos1.y = areaData.y1.toFixed(1);
            pos2.y = areaData.y2.toFixed(1);
        } else {
            pos1.y = areaData.y2.toFixed(1);
            pos2.y = areaData.y1.toFixed(1);
        }
        if (areaData.z1.toFixed(1) <= areaData.z2.toFixed(1)) {
            pos1.z = areaData.z1.toFixed(1);
            pos2.z = areaData.z2.toFixed(1);
        } else {
            pos1.z = areaData.z2.toFixed(1);
            pos2.z = areaData.z1.toFixed(1);
        }

        for (let i = 0; i < serverInstance.minecraft.getLevel().players.size(); i++) {
            let playerNetID: NetworkIdentifier = serverInstance.minecraft.getLevel().players.get(i).getNetworkIdentifier();
            let playerActor: Actor | null = playerNetID.getActor();
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
                                        bedrockServer.executeCommand(`/execute "${playerName}" ~ ~ ~ ` + areaData.on_inside, true, 3);
                                    }
                                }
                            } else {

                                // console.log("Player has just entered: " + areaData.name);

                                plPlayer.addPLArea(areaData.name, true);
                                if (areaData.on_enter != "") {
                                    bedrockServer.executeCommand(`/execute "${playerName}" ~ ~ ~ ` + areaData.on_enter, true, 3);
                                }
                            }

                        }
                    }
                } else {
                    let plPlayer = playerlistDB.getPlayer(playerActor);
                    if (plPlayer != undefined) {
                        if (plPlayer.getPLArea(areaData.name) != undefined) {
                            plPlayer.delPLArea(areaData.name);

                            // console.log("Player has just left: " + areaData.name);

                            if (areaData.on_exit != "") {
                                bedrockServer.executeCommand(`/execute "${playerName}" ~ ~ ~ ` + areaData.on_exit, true, 3);
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