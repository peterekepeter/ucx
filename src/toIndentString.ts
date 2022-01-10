
export function toIndentString(count: number): string {
    if (count < 0) {
        throw new Error('expected positive');
    }
    let s = '';
    switch (count) 
    {
    case 0: s = ''; break;
    case 1: s = '\t'; break;
    case 2: s = '\t\t'; break;
    case 3: s = '\t\t\t'; break;
    case 4: s = '\t\t\t\t'; break;
    case 5: s = '\t\t\t\t\t'; break;
    case 6: s = '\t\t\t\t\t\t'; break;
    case 7: s = '\t\t\t\t\t\t\t'; break;
    case 8: s = '\t\t\t\t\t\t\t\t'; break;
    case 9: s = '\t\t\t\t\t\t\t\t\t'; break;
    case 10: s = '\t\t\t\t\t\t\t\t\t\t'; break;
    case 11: s = '\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 12: s = '\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 13: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 14: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 15: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 16: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 17: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 18: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 19: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    case 20: s = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'; break;
    default: s = toIndentString(Math.floor(count / 2)) + toIndentString(Math.ceil(count / 2)); break;
    }
    if (s.length !== count) {
        throw new Error('numberToSpaces implementation error');
    }
    return s;
}
