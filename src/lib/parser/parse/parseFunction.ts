import { SemanticClass as C, ParserToken, SemanticClass, UcParser } from "..";
import { createEmptyUnrealClassFunction, UnrealClassExpression, UnrealClassFunctionArgument } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { clearModifiers } from "./parseModifiers";
import { parseNoneState } from "./parseNoneState";
import { parseStatement } from "./parseStatement";
import { resolveExpression } from "./resolveExpression";
import { resolveFunctionModifiers } from "./resolveFunctionModifiers";


export function parseFnBegin(parser: UcParser, token: Token)
{
    const container = parser.currentClassState 
        ? parser.lastState.functions 
        : parser.result.functions;
    container.push({
        ...createEmptyUnrealClassFunction(),
        ...resolveFunctionModifiers(parser),
    });
    parser.rootFn = parseFnDeclaration;
    token.type = C.Keyword;
    clearModifiers(parser);
}

function parseFnDeclaration(parser: UcParser, token: Token){
    const fn = parser.lastFn;
    if (token.textLower === 'private'){
        token.type = C.Keyword;
        fn.isPrivate = true;
        return;
    }
    fn.name = token;
    token.type = C.FunctionDeclaration;
    parser.rootFn = parseFnParamBeginOrName;
}

function parseFnParamBeginOrName(parser: UcParser, token:Token){
    switch (token.text){
    case "(":
        parseFnParamBegin(parser, token);
        break;
    default:
        const fn = parser.lastFn;
        if (fn.name != null){
            // misinterpreted, name is actually the type
            fn.returnType = fn.name;
            fn.returnType.type = C.TypeReference;
        }
        fn.name = token;
        token.type = C.FunctionDeclaration;
        break;
    }
}

function parseFnParamBegin(parser:UcParser, token:Token){
    let message = '';
    switch (token.text){
    case "(":
        parser.lastFn.fnArgsFirstToken = token;
        parser.fnArgTokens = [];
        parser.rootFn = parseFnParams;
        break;
    default: 
        message = "Expected function parameters '('";
        parser.result.errors.push({ token, message });
        break;
    }
}

function parseFnParams(parser: UcParser, token: Token)
{
    const fn = parser.lastFn;
    let message = '';
    switch (token.text){
    case ",":
        token.type = SemanticClass.None;
        fn.fnArgs.push(resolveFnArg(parser, parser.fnArgTokens));
        parser.fnArgTokens = [];
        break;
    case ")":
        if (parser.fnArgTokens.length > 0){
            fn.fnArgs.push(resolveFnArg(parser, parser.fnArgTokens));
        }
        fn.fnArgsLastToken = token;
        parser.rootFn = parseFnAfterParameters;
        break;
    default: 
        parser.fnArgTokens.push(token);
        break;
    }
}
function resolveFnArg(parser: UcParser, tokens: Token[]): UnrealClassFunctionArgument {
    const length = tokens.length;
    const last = length - 1;
    let arrayCount: number|null = null;
    let arrayCountToken: Token|null = null;
    let arrayCountExpression: UnrealClassExpression|Token|null = null;
    if (tokens[last].text === ']') {
        for (let i=last; i>=0; i-=1){
            if (tokens[i].text === '[')
            {
                const expr = tokens.slice(i+1, last);
                tokens = tokens.slice(0, i);
                arrayCountExpression = resolveExpression(expr);
                if ('text' in arrayCountExpression && arrayCountExpression.type === C.LiteralNumber)
                {
                    arrayCountToken = arrayCountExpression;
                    arrayCount = parseInt(arrayCountToken.text);
                }
                break;
            }
        }
        if (!arrayCountExpression){
            parser.result.errors.push({
                message: "Unsupported array count expression",
                token: tokens[last],
            });
        }
    }
    const name = tokens.length >= 1 ? tokens[tokens.length - 1] : null;
    let type = tokens.length >= 2 ? tokens[tokens.length - 2] : null;
    let template: Token|null = null;
    let modifiersStart = 0;
    let modifiersEnd = tokens.length >= 3 ? tokens.length - 2 : 0;
    if (type?.text === '>'){
        if (tokens.length >= 5) {
            type = tokens[tokens.length - 5];
            const close = tokens[tokens.length - 2];
            const open = tokens[tokens.length - 4];
            template = tokens[tokens.length - 3];
            open.type = C.None;
            close.type = C.None;
            type.type = C.TypeReference;
            template.type = C.TypeReference;
            modifiersEnd = tokens.length - 5;
        }
        else {
            parser.result.errors.push({
                message: "Invalid parameter type declaration.",
                token: type,
            });
        }
    }
    if (name != null){
        name.type = C.LocalVariable;
    }
    if (type != null){
        type.type = C.TypeReference;
    }
    else {
        if (name) {
            parser.result.errors.push({
                message: 'Function parameter is missing type',
                token: name,
            });
        }
    }
    let isOut = false;
    let isOptional = false;
    let isCoerce = false;
    let isSkip = false;
    for (let i = modifiersStart; i < modifiersEnd; i+=1){
        const modifierToken = tokens[i];
        switch(modifierToken.textLower){
        case "out":
            isOut = true;
            modifierToken.type = C.Keyword;
            break;
        case "optional":
            isOptional = true;
            modifierToken.type = C.Keyword;
            break;
        case "coerce":
            isCoerce = true;
            modifierToken.type = C.Keyword;
            break;
        case "skip":
            isSkip = true;
            modifierToken.type = C.Keyword;
            break;
        default:
            parser.result.errors.push({
                message: "Unknown function parameter type modifier.",
                token: modifierToken,
            });
            break;
        }
    }
    return { 
        name, 
        type, 
        isOut, 
        isOptional, 
        isCoerce, 
        isSkip,
        template, 
        arrayCount, 
        arrayCountExpression,
        arrayCountToken
    };
}

function parseFnAfterParameters(parser: UcParser, token: Token)
{
    const fn = parser.lastFn;
    switch (token.text){
    case "{":
        fn.bodyFirstToken = token;
        fn.bodyLastToken = token;
        parser.rootFn = parseStatement;
        break;
    case ";":
        // missing body, don't set body tokens
        parser.rootFn = parseNoneState;
        break;
    }
}
