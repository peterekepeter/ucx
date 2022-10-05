import { tokenizeLine } from "../tokenizer/tokenizeLine";
import { IniToken, IniTokenType } from "./IniToken";


export function iniTokenize(input: string): IniToken[] {
    const result = new Array<IniToken>();
    const lines = input.split(/\r?\n/);
    for (let i=0; i<lines.length; i++) {
        const lineText = lines[i];
        const tokens = iniTokenizeLine(lineText, i);
        for (const token of tokens) {
            result.push(token);
        }
    }
    return result;
}

function* iniTokenizeLine(input: string, line: number): Iterable<IniToken> {
    const keyValueMatch = keyValueRegex.exec(input);
    if (keyValueMatch){
        const [_, key, operator, value] = keyValueMatch;
        const posKey = keyValueMatch.index;
        const posOperatoir = posKey + key.length;
        const posValue = posOperatoir + operator.length;
        yield { line, position: posKey, text: key, tokenType: IniTokenType.KeyName };
        yield { line, position: posOperatoir, text: operator, tokenType: IniTokenType.KeyEquals };
        yield { line, position: posValue, text: value, tokenType: IniTokenType.Value };
        return;
    }
    const sectionMatch = sectionRegex.exec(input);
    if (sectionMatch){
        const position = sectionMatch.index;
        yield { line, position, text: sectionMatch[0], tokenType: IniTokenType.Section };
    }
    
}

const keyValueRegex = /([a-z]+)(=)([^\r\n]*)/i;
const sectionRegex = /\[[^\]]*\]/i;

