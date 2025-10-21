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
    switch (token.textLower)
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

    case 'safereplace':
        parser.result.classDeclarationLastToken = token;
        parser.result.isSafeReplace = true;
        token.type = SemanticClass.Keyword;
        break;

    case 'intrinsic':
        parser.result.classDeclarationLastToken = token;
        parser.result.isIntrinsic = true;
        token.type = SemanticClass.Keyword;
        break;

    case 'noexport':
        parser.result.classDeclarationLastToken = token;
        parser.result.isNoExport = true;
        token.type = SemanticClass.Keyword;
        break;

    case 'nativereplication':
        parser.result.classDeclarationLastToken = token;
        parser.result.isNativeReplication = true;
        token.type = SemanticClass.Keyword;
        break;

    case 'perobjectconfig':
        parser.result.classDeclarationLastToken = token;
        parser.result.isPerObjectConfig = true;
        token.type = SemanticClass.Keyword;
        break;

    case 'transient':
        parser.result.classDeclarationLastToken = token;
        parser.result.isTransient = true;
        token.type = SemanticClass.Keyword;
        break;
    
    case 'config':
        token.type = SemanticClass.Keyword;
        parser.rootFn = parseConfigOpenParen;
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
    parser.rootFn = parseAfterClassParent;
    token.type = SemanticClass.ClassReference;
}

function parseAfterClassParent(parser: UcParser, token: Token) {
    if (token.text === ".")
    {
        const r = parser.result;
        if (r.parentName) {
            r.parentPackageName = r.parentName;
            r.parentPackageName.type = SemanticClass.PackageReference;
            r.parentName = null;
        }
        parser.rootFn = parseClassParent
    }
    else 
    {
        parseClassDecorators(parser, token);
    }
}


function parseConfigOpenParen(parser: UcParser, token: Token) { 
    switch (token.text){
    case "(":
        parser.rootFn = parseClassConfigName;
        break;
    default:
        parseClassDecorators(parser, token);
        return;
    }
}

function parseClassConfigName(parser: UcParser, token: Token) { 
    switch (token.text){
    default:
        parser.result.configName = token;
        parser.rootFn = parseConfigCloseParen;
        break;
    }
}

function parseConfigCloseParen(parser: UcParser, token: Token) { 
    switch (token.text){
    case ")":
        parser.rootFn = parseClassDecorators;
        break;
    default:
        parser.result.errors.push({token, message: "Expected ')'"});
        parser.rootFn = parseClassDecorators;
        break;
    }
}