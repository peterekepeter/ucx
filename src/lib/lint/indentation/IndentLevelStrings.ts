import { IndentationType } from "./IndentationType";

export class IndentLevelStrings {
    private lut: string[] = [''];

    constructor(private indentType: IndentationType) { }

    getIndentString(level: number) {
        if (level < 0) {
            throw new Error('expected positive');
        }
        for (let i = this.lut.length; i <= level; i += 1) {
            this.lut[i] = this.lut[i - 1] + this.indentType;
        }
        return this.lut[level];
    }

}
