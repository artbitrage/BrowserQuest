export var MessageType;
(function (MessageType) {
    MessageType[MessageType["HELLO"] = 0] = "HELLO";
    MessageType[MessageType["WELCOME"] = 1] = "WELCOME";
    MessageType[MessageType["SPAWN"] = 2] = "SPAWN";
    MessageType[MessageType["DESPAWN"] = 3] = "DESPAWN";
    MessageType[MessageType["MOVE"] = 4] = "MOVE";
    MessageType[MessageType["LOOTMOVE"] = 5] = "LOOTMOVE";
    MessageType[MessageType["AGGRO"] = 6] = "AGGRO";
    MessageType[MessageType["ATTACK"] = 7] = "ATTACK";
    MessageType[MessageType["HIT"] = 8] = "HIT";
    MessageType[MessageType["HURT"] = 9] = "HURT";
    MessageType[MessageType["HEALTH"] = 10] = "HEALTH";
    MessageType[MessageType["CHAT"] = 11] = "CHAT";
    MessageType[MessageType["LOOT"] = 12] = "LOOT";
    MessageType[MessageType["EQUIP"] = 13] = "EQUIP";
    MessageType[MessageType["DROP"] = 14] = "DROP";
    MessageType[MessageType["TELEPORT"] = 15] = "TELEPORT";
    MessageType[MessageType["DAMAGE"] = 16] = "DAMAGE";
    MessageType[MessageType["POPULATION"] = 17] = "POPULATION";
    MessageType[MessageType["KILL"] = 18] = "KILL";
    MessageType[MessageType["LIST"] = 19] = "LIST";
    MessageType[MessageType["WHO"] = 20] = "WHO";
    MessageType[MessageType["ZONE"] = 21] = "ZONE";
    MessageType[MessageType["DESTROY"] = 22] = "DESTROY";
    MessageType[MessageType["HP"] = 23] = "HP";
    MessageType[MessageType["BLINK"] = 24] = "BLINK";
    MessageType[MessageType["OPEN"] = 25] = "OPEN";
    MessageType[MessageType["CHECK"] = 26] = "CHECK";
})(MessageType || (MessageType = {}));
export var EntityKind;
(function (EntityKind) {
    EntityKind[EntityKind["WARRIOR"] = 1] = "WARRIOR";
    // Mobs
    EntityKind[EntityKind["RAT"] = 2] = "RAT";
    EntityKind[EntityKind["SKELETON"] = 3] = "SKELETON";
    EntityKind[EntityKind["GOBLIN"] = 4] = "GOBLIN";
    EntityKind[EntityKind["OGRE"] = 5] = "OGRE";
    EntityKind[EntityKind["SPECTRE"] = 6] = "SPECTRE";
    EntityKind[EntityKind["CRAB"] = 7] = "CRAB";
    EntityKind[EntityKind["BAT"] = 8] = "BAT";
    EntityKind[EntityKind["WIZARD"] = 9] = "WIZARD";
    EntityKind[EntityKind["EYE"] = 10] = "EYE";
    EntityKind[EntityKind["SNAKE"] = 11] = "SNAKE";
    EntityKind[EntityKind["SKELETON2"] = 12] = "SKELETON2";
    EntityKind[EntityKind["BOSS"] = 13] = "BOSS";
    EntityKind[EntityKind["DEATHKNIGHT"] = 14] = "DEATHKNIGHT";
    // Armors
    EntityKind[EntityKind["FIREFOX"] = 20] = "FIREFOX";
    EntityKind[EntityKind["CLOTHARMOR"] = 21] = "CLOTHARMOR";
    EntityKind[EntityKind["LEATHERARMOR"] = 22] = "LEATHERARMOR";
    EntityKind[EntityKind["MAILARMOR"] = 23] = "MAILARMOR";
    EntityKind[EntityKind["PLATEARMOR"] = 24] = "PLATEARMOR";
    EntityKind[EntityKind["REDARMOR"] = 25] = "REDARMOR";
    EntityKind[EntityKind["GOLDENARMOR"] = 26] = "GOLDENARMOR";
    // Objects
    EntityKind[EntityKind["FLASK"] = 35] = "FLASK";
    EntityKind[EntityKind["BURGER"] = 36] = "BURGER";
    EntityKind[EntityKind["CHEST"] = 37] = "CHEST";
    EntityKind[EntityKind["FIREPOTION"] = 38] = "FIREPOTION";
    EntityKind[EntityKind["CAKE"] = 39] = "CAKE";
    // NPCs
    EntityKind[EntityKind["GUARD"] = 40] = "GUARD";
    EntityKind[EntityKind["KING"] = 41] = "KING";
    EntityKind[EntityKind["OCTOCAT"] = 42] = "OCTOCAT";
    EntityKind[EntityKind["VILLAGEGIRL"] = 43] = "VILLAGEGIRL";
    EntityKind[EntityKind["VILLAGER"] = 44] = "VILLAGER";
    EntityKind[EntityKind["PRIEST"] = 45] = "PRIEST";
    EntityKind[EntityKind["SCIENTIST"] = 46] = "SCIENTIST";
    EntityKind[EntityKind["AGENT"] = 47] = "AGENT";
    EntityKind[EntityKind["RICK"] = 48] = "RICK";
    EntityKind[EntityKind["NYAN"] = 49] = "NYAN";
    EntityKind[EntityKind["SORCERER"] = 50] = "SORCERER";
    EntityKind[EntityKind["BEACHNPC"] = 51] = "BEACHNPC";
    EntityKind[EntityKind["FORESTNPC"] = 52] = "FORESTNPC";
    EntityKind[EntityKind["DESERTNPC"] = 53] = "DESERTNPC";
    EntityKind[EntityKind["LAVANPC"] = 54] = "LAVANPC";
    EntityKind[EntityKind["CODER"] = 55] = "CODER";
    // Weapons
    EntityKind[EntityKind["SWORD1"] = 60] = "SWORD1";
    EntityKind[EntityKind["SWORD2"] = 61] = "SWORD2";
    EntityKind[EntityKind["REDSWORD"] = 62] = "REDSWORD";
    EntityKind[EntityKind["GOLDENSWORD"] = 63] = "GOLDENSWORD";
    EntityKind[EntityKind["MORNINGSTAR"] = 64] = "MORNINGSTAR";
    EntityKind[EntityKind["AXE"] = 65] = "AXE";
    EntityKind[EntityKind["BLUESWORD"] = 66] = "BLUESWORD";
})(EntityKind || (EntityKind = {}));
export var Orientation;
(function (Orientation) {
    Orientation[Orientation["UP"] = 1] = "UP";
    Orientation[Orientation["DOWN"] = 2] = "DOWN";
    Orientation[Orientation["LEFT"] = 3] = "LEFT";
    Orientation[Orientation["RIGHT"] = 4] = "RIGHT";
})(Orientation || (Orientation = {}));
export const EntityKindMap = {
    [EntityKind.WARRIOR]: ['warrior', 'player'],
    [EntityKind.RAT]: ['rat', 'mob'],
    [EntityKind.SKELETON]: ['skeleton', 'mob'],
    [EntityKind.GOBLIN]: ['goblin', 'mob'],
    [EntityKind.OGRE]: ['ogre', 'mob'],
    [EntityKind.SPECTRE]: ['spectre', 'mob'],
    [EntityKind.CRAB]: ['crab', 'mob'],
    [EntityKind.BAT]: ['bat', 'mob'],
    [EntityKind.WIZARD]: ['wizard', 'mob'],
    [EntityKind.EYE]: ['eye', 'mob'],
    [EntityKind.SNAKE]: ['snake', 'mob'],
    [EntityKind.SKELETON2]: ['skeleton2', 'mob'],
    [EntityKind.BOSS]: ['boss', 'mob'],
    [EntityKind.DEATHKNIGHT]: ['deathknight', 'mob'],
    [EntityKind.FIREFOX]: ['firefox', 'armor'],
    [EntityKind.CLOTHARMOR]: ['clotharmor', 'armor'],
    [EntityKind.LEATHERARMOR]: ['leatherarmor', 'armor'],
    [EntityKind.MAILARMOR]: ['mailarmor', 'armor'],
    [EntityKind.PLATEARMOR]: ['platearmor', 'armor'],
    [EntityKind.REDARMOR]: ['redarmor', 'armor'],
    [EntityKind.GOLDENARMOR]: ['goldenarmor', 'armor'],
    [EntityKind.FLASK]: ['flask', 'object'],
    [EntityKind.BURGER]: ['burger', 'object'],
    [EntityKind.CHEST]: ['chest', 'object'],
    [EntityKind.FIREPOTION]: ['firepotion', 'object'],
    [EntityKind.CAKE]: ['cake', 'object'],
    [EntityKind.GUARD]: ['guard', 'npc'],
    [EntityKind.KING]: ['king', 'npc'],
    [EntityKind.OCTOCAT]: ['octocat', 'npc'],
    [EntityKind.VILLAGEGIRL]: ['villagegirl', 'npc'],
    [EntityKind.VILLAGER]: ['villager', 'npc'],
    [EntityKind.PRIEST]: ['priest', 'npc'],
    [EntityKind.SCIENTIST]: ['scientist', 'npc'],
    [EntityKind.AGENT]: ['agent', 'npc'],
    [EntityKind.RICK]: ['rick', 'npc'],
    [EntityKind.NYAN]: ['nyan', 'npc'],
    [EntityKind.SORCERER]: ['sorcerer', 'npc'],
    [EntityKind.BEACHNPC]: ['beachnpc', 'npc'],
    [EntityKind.FORESTNPC]: ['forestnpc', 'npc'],
    [EntityKind.DESERTNPC]: ['desertnpc', 'npc'],
    [EntityKind.LAVANPC]: ['lavanpc', 'npc'],
    [EntityKind.CODER]: ['coder', 'npc'],
    [EntityKind.SWORD1]: ['sword1', 'weapon'],
    [EntityKind.SWORD2]: ['sword2', 'weapon'],
    [EntityKind.REDSWORD]: ['redsword', 'weapon'],
    [EntityKind.GOLDENSWORD]: ['goldensword', 'weapon'],
    [EntityKind.MORNINGSTAR]: ['morningstar', 'weapon'],
    [EntityKind.AXE]: ['axe', 'weapon'],
    [EntityKind.BLUESWORD]: ['bluesword', 'weapon'],
};
export const RankedWeapons = [
    EntityKind.SWORD1,
    EntityKind.SWORD2,
    EntityKind.AXE,
    EntityKind.MORNINGSTAR,
    EntityKind.BLUESWORD,
    EntityKind.REDSWORD,
    EntityKind.GOLDENSWORD,
];
export const RankedArmors = [
    EntityKind.CLOTHARMOR,
    EntityKind.LEATHERARMOR,
    EntityKind.MAILARMOR,
    EntityKind.PLATEARMOR,
    EntityKind.REDARMOR,
    EntityKind.GOLDENARMOR,
];
