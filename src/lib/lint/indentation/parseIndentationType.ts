import { IndentationType } from "./IndentationType";

export function parseIndentationType(value: string | undefined): IndentationType | undefined {
    if  (!value) {
        return undefined;
    }
    const number = Number.parseInt(value?.trim());
    if (!isNaN(number)) {
        switch (number){
        case 1: return ' ';
        case 2: return '  ';
        case 3: return '   ';
        case 4: return '    ';
        case 5: return '     ';
        case 6: return '      ';
        case 7: return '       ';
        case 8: return '        ';
        default: return '    ';
        }
    }
    if (value?.trim() === '\\t') {
        return '\t';
    }
    return undefined;
}