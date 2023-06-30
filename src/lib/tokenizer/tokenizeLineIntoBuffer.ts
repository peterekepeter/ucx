import { LineToken as LineToken } from "./LineToken";


export function tokenizeLineIntoBuffer(input: string, result: LineToken[], regex: RegExp) {
    let match: RegExpExecArray | null;

    while (match = regex.exec(input)) {
        const text = match[0];
        result.push({
            position: regex.lastIndex - text.length,
            text
        });
        
    }
    return result;
}
