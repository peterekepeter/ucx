import { UcToken } from "./UcToken";

//             identifiers     | linecomm | mlinecomm      | numeric         | strings       | names |  operators                                                                                        | syntax   
const regex = /[_a-z][_a-z0-9]*|\/\/[^\n]*|\/\*|\*\/|[0-9][0-9a-fx\.]*|"(?:[^"]|\\")*"|'[^']*'|!=|==|!|&&|\^\^|\|\||\*=|\/=|\+=|\-=|\=|\+\+|--|~|-|\*|\/|\+|<<|>>|<=|>=|<|>|&|\^|\||\*\*|%|~=|\$|@|\.|;|\(|\)|,|\{|\}|\]|\[/gi;

/**
 * assumes input is on single line, returned tokens be on given line
 */  
export function ucTokenizeLine(input: string, line = 0): UcToken[] {
    const result = new Array<UcToken>();
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
