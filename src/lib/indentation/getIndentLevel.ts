import { IndentationType } from "./IndentationType";

export function getIndentLevel(lineText: string, indentType: IndentationType): number {
    let tabs = 0;
    let spaces = 0;
    for (let i = 0; i < lineText.length; i++) {
        if (lineText[i] === '\t') {
            tabs += 1;
        } if (lineText[i] === ' ') {
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
