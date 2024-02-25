import { LineToken } from "./LineToken";
import { tokenizeLine } from "./tokenizeLine";

const regex =
    // identifiers  | linecomm | exec  | mlinecomm | numeric                       | strings                         | names | multi char operators                           | single char operators & syntax    
    /[_a-z][_a-z\d]*|\/\/[^\n]*|#[^\n]*|\/\*+|\*+\/|(?:(?<=[=+-])[+-])?\d[\da-fx.]*|".*?(?<![^\\]\\)(?<![^\\]\\\\\\)"|'[^']*'|[-!~=*/+<>]=|&&|\^\^|\|\||\+\+|--|\*\*|<<|>>>|>>|[-+*/~<=>!&^|%$@.:;(),{}[\]]/gi
;
/**
 * assumes input is on single line, returned tokens be on given line
 */  
export function ucTokenizeLine(input: string): LineToken[] {
    return tokenizeLine(input, regex);
}
