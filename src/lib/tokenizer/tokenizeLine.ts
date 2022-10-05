import { LineToken as LineToken } from "./LineToken";
import { tokenizeLineIntoBuffer } from "./tokenizeLineIntoBuffer";


export function tokenizeLine(input: string, regex: RegExp): LineToken[] {
    const result = new Array<LineToken>();

    tokenizeLineIntoBuffer(input, result, regex);

    return result;
}
