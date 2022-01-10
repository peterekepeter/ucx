export function getIndentLevel(lineText: string): number {
    let level = 0;
    for (let i = 0; i < lineText.length; i++) {
        if (lineText[i] === '\t') {
            level++;
        } else {
            break;
        }
    }
    return level;
}
