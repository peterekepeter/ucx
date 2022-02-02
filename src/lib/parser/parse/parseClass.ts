import { SemanticClass, Token } from "../types";
import { parseNoneState, UcParser } from "../UcParser";


export function isParsingClassFn(fn: any){
    return fn === parseClassName ||
        fn === parseClassDecorators ||
        fn === parseClassParent;
}

export function parseClassName(parser: UcParser, token: Token) {
    parser.result.name = token;
    parser.rootFn = parseClassDecorators;
    token.classification = SemanticClass.ClassDeclaration;
}

function parseClassDecorators(parser: UcParser, token: Token) { 
    let message: string;
    switch (token.text)
    {
    case 'expands':
    case 'extends':
        parser.rootFn = parseClassParent;
        token.classification = SemanticClass.Keyword;
        break;
        
    case 'abstract':
        parser.result.isAbstract = true;
        token.classification = SemanticClass.Keyword;
        break;

    case 'native':
        parser.result.isNative = true;
        token.classification = SemanticClass.Keyword;
        break;

    case 'nativereplication':
        parser.result.isNativeReplication = true;
        token.classification = SemanticClass.Keyword;
        break;

    case ';':
        parser.rootFn = parseNoneState;
        break;

    case 'var':
    case 'function':
        message = `Unexpected "${token.text}", forgot a ";" after class declaration.`;
        parser.result.errors.push({ token, message });
        parseNoneState(parser, token);
        break;

    default:
        message = 'Unexpected class decorator, maybe forgot a ";"';
        parser.result.errors.push({ token, message });
        break;
    }
}

function parseClassParent(parser: UcParser, token: Token) {
    parser.result.parentName = token;
    parser.rootFn = parseClassDecorators;
    token.classification = SemanticClass.ClassReference;
}

