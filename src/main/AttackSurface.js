export class AttackSurface {
    constructor() {
        this.attackSurface = [];
    }

    addToAttackSurface(JSONlink) {
        this.attackSurface.push(JSONlink);
    }

    getAttackSurface() {
        return this.attackSurface;
    }
}