import { Token } from "../types";
import { SemanticClass } from "../token";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";


export function isParsingClassFn(fn: any){
    return fn === parseClassName ||
        fn === parseClassDecorators ||
        fn === parseClassParent;
}

export function parseClassName(parser: UcParser, token: Token) {
    parser.result.name = token;
    parser.rootFn = parseClassDecorators;
    token.type = SemanticClass.ClassDeclaration;
}

function parseClassDecorators(parser: UcParser, token: Token) { 
    let message: string;
    switch (token.text)
    {
    case 'expands':
    case 'extends':
        parser.result.classDeclarationLastToken = token;
        parser.rootFn = parseClassParent;
        token.type = SemanticClass.Keyword;
        break;
        
    case 'abstract':
        parser.result.classDeclarationLastToken = token;
        parser.result.isAbstract = true;
        token.type = SemanticClass.Keyword;
        break;

    case 'native':
        parser.result.classDeclarationLastToken = token;
        parser.result.isNative = true;
        token.type = SemanticClass.Keyword;
        break;

    case 'nativereplication':
        parser.result.classDeclarationLastToken = token;
        parser.result.isNativeReplication = true;
        token.type = SemanticClass.Keyword;
        break;

    case ';':
        parser.result.classDeclarationLastToken = token;
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
    token.type = SemanticClass.ClassReference;
}

