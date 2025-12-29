import { randomInt } from './utils.js';
export const calculateDamage = (weaponLevel, armorLevel) => {
    const dealt = weaponLevel * randomInt(5, 10);
    const absorbed = armorLevel * randomInt(1, 3);
    const dmg = dealt - absorbed;
    if (dmg <= 0) {
        return randomInt(0, 3);
    }
    return dmg;
};
export const calculateMaxHp = (armorLevel) => {
    return 80 + (armorLevel - 1) * 30;
};
