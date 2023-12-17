import { IndentationType } from "./IndentationType";

export function getIndentLevel(lineText: string, indentType: IndentationType): number {
    let tabs = 0;
    let spaces = 0;
    for (const char of lineText) {
        if (char === '\t') {
            tabs += 1;
        } 
        if (char === ' ') {
            spaces += 1;
        }
        else {
            break;
        }
    }
    let level = tabs;
    if (indentType !== '\t'){
        level += Math.floor(spaces / indentType.length);
    }
    return level;
}
