import { LineToken as LineToken } from "./LineToken";
import { splitLines } from "./splitLines";
import { tokenizeLine } from "./tokenizeLine";

//             identifiers     | linecomm | exec  | mlinecomm      | numeric  | strings               | names | operators                                                                                               | syntax   
const regex = /[_a-z][_a-z0-9]*|\/\/[^\n]*|#[^\n]*|\/\*|\*\/|[0-9][0-9a-fx\.]*|"(?:[^"]*|\\.)*(?<!\\)"|'[^']*'|!=|~=|==|!|&&|\^\^|\|\||\*=|\/=|\+=|\-=|\=|\+\+|--|~|-|\*|\/|\+|<<|>>|<=|>=|<|>|&|\^|\||\*\*|%|~=|\$|@|\.|:|;|\(|\)|,|\{|\}|\]|\[/gi;

/**
 * assumes input is on single line, returned tokens be on given line
 */  
export function ucTokenizeLine(input: string): LineToken[] {
    return tokenizeLine(input, regex);
}
