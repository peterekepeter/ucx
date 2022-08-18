import { SemanticClass as C, SemanticClass, UcParser } from "..";
import { createEmptyUnrealClassFunction, UnrealClassFunctionArgument } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { clearModifiers } from "./clearModifiers";
import { parseNoneState } from "./parseNoneState";
import { parseStatement } from "./parseStatement";
import { resolveFunctionModifiers } from "./resolveFunctionModifiers";


export function parseFnBegin(parser: UcParser, token: Token)
{
    // are we parsing a state function or a class function?
    (parser.currentClassState 
        ? parser.lastState.functions 
        : parser.result.functions
    ).push({
        ...createEmptyUnrealClassFunction(),
        ...resolveFunctionModifiers(parser.modifiers),
    });
    parser.rootFn = parseFnDeclaration;
    token.type = C.Keyword;
    clearModifiers(parser);
}


export function parseFnDeclaration(parser: UcParser, token: Token){
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
        fn.fnArgs.push(resolveFnArg(parser.fnArgTokens));
        parser.fnArgTokens = [];
        break;
    case ")":
        if (parser.fnArgTokens.length > 0){
            fn.fnArgs.push(resolveFnArg(parser.fnArgTokens));
        }
        fn.fnArgsLastToken = token;
        parser.rootFn = parseFnAfterParameters;
        break;
    default: 
        parser.fnArgTokens.push(token);
        break;
    }
}
function resolveFnArg(tokens: Token[]): UnrealClassFunctionArgument {
    const name = tokens.length >= 1 ? tokens[tokens.length - 1] : null;
    const type = tokens.length >= 2 ? tokens[tokens.length - 2] : null;
    if (name != null){
        name.type = C.LocalVariable;
    }
    if (type != null){
        type.type = C.TypeReference;
    }
    const modifiers = tokens.length >= 3 ? tokens.slice(0, tokens.length - 2) : [];
    let isOut = false;
    let isOptional = false;
    let isCoerce = false;
    for (const modifierToken of modifiers){
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
        default:
            // TODO error
            break;
        }
    }
    return { name, type, isOut, isOptional, isCoerce };
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
