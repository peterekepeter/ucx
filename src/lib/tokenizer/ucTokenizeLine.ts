import { UcToken } from "./UcToken";

//             identifiers     | linecomm | exec  | mlinecomm      | numeric         | strings       | names |  operators                                                                                        | syntax   
const regex = /[_a-z][_a-z0-9]*|\/\/[^\n]*|#[^\n]*|\/\*|\*\/|[0-9][0-9a-fx\.]*|"(?:[^"]|\\")*"|'[^']*'|!=|==|!|&&|\^\^|\|\||\*=|\/=|\+=|\-=|\=|\+\+|--|~|-|\*|\/|\+|<<|>>|<=|>=|<|>|&|\^|\||\*\*|%|~=|\$|@|\.|;|\(|\)|,|\{|\}|\]|\[/gi;

/**
 * assumes input is on single line, returned tokens be on given line
 */  
export function ucTokenizeLine(input: string, line = 0): UcToken[] {
    const result = new Array<UcToken>();

    parseTokens(input, result, regex);

    return result;
}

export function parseTokens(input: string, result: UcToken[], regex: RegExp) {
    let match: RegExpExecArray | null;

    while (match = regex.exec(input)){
        const text = match[0];
        result.push({
            position: regex.lastIndex - text.length,
            text
        });
    }

    return result;
}
