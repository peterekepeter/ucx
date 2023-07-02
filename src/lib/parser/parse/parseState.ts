import { SemanticClass, UcParser } from "..";
import { Token } from "../types";
import { parseFnBegin } from "./parseFunction";
import { isModifier, parseModifier } from "./parseModifiers";
import { parseNoneState } from "./parseNoneState";
import { parseStatement } from "./parseStatement";

export function parseState(parser: UcParser, token: Token) {
    if (token.text === '(')
    {
        // state()
        parser.rootFn = parseStateParen;
        return;
    }
    parser.lastState.name = token;
    token.type = SemanticClass.StateDeclaration;
    parser.rootFn = parseStateOpenBody; 
}

function parseStateParen(parser: UcParser, token: Token) {
    // no idea what this paren is for
    if (token.text === ')')
    {
        parser.rootFn = parseState;
        return;
    }
    else {
        // do nothing
    }
}

function parseStateExtends(parser: UcParser, token: Token) {
    if (token.text === "{")
    {
        parser.result.errors.push({ 
            token, message: "Expected name of a state but found '{' instead."
        });
        parseStateOpenBody(parser, token);
        return;
    }
    token.type = SemanticClass.StateReference;
    const state = parser.lastState;
    state.parentStateName = token;
    parser.rootFn = parseStateOpenBody; 
}

function parseStateOpenBody(parser: UcParser, token: Token) {
    if (token.textLower === 'extends' || token.textLower === 'expands')
    {
        token.type = SemanticClass.Keyword;
        parser.rootFn = parseStateExtends;
        return;
    }
    if (token.text !== "{")
    {
        parser.result.errors.push({ token, message: "Expected '{'"});
        return;
    }
    const state = parser.currentClassState;
    if (state){
        state.bodyFirstToken = token;
        state.bodyLastToken = token;
    }
    parser.rootFn = parseStateBody;
}

export function parseStateBody(parser: UcParser, token: Token) {
    const state = parser.currentClassState;
    if (state){
        state.bodyLastToken = token;
    }
    parser.currentlyInStateFunction = false;

    if (isModifier(token))
    {
        parseModifier(parser, token);
        return;
    }

    switch (token.textLower){

    case 'ignores':
        token.type = SemanticClass.Keyword;
        parser.rootFn = parseStateIgnores;
        break;

    case 'event':
    case 'function':
        parser.currentlyInStateFunction = true;
        parseFnBegin(parser, token);
        break;
        
    case "}":
        parser.currentClassState = null;
        parser.rootFn = parseNoneState;
        break;

    default:
        parser.rootFn = parseStatement;
        parseStatement(parser, token);
        break;
    }
}

export function parseStateIgnores(parser: UcParser, token: Token) {
    const state = parser.currentClassState;
    if (!state) {
        parser.result.errors.push({
            message: "Invalid parser state inside state ignores.",
            token: token,
        });
        parseStateBody(parser, token);
        return;
    }

    if (isModifier(token)){
        parser.result.errors.push({
            message: "Unexpected token inside state ignores, missing semicolon?",
            token: token,
        });
        parseStateBody(parser, token);
        return;
    }
    
    switch (token.textLower){

    case 'event':
    case 'function':
        parser.result.errors.push({
            message: "Unexpected token inside state ignores, missing semicolon?",
            token: token,
        });
        parseStateBody(parser, token);
        return;
        
    case "}":
        parser.result.errors.push({
            message: "Unexpected token inside state ignores, missing semicolon?",
            token: token,
        });
        parseStateBody(parser, token);
        return;
    
    case ";":
        parser.rootFn = parseStateBody;
        break;

    default:
        token.type = SemanticClass.FunctionReference;
        state?.ignores.push(token);
        parser.rootFn = parseStateIgnoresComma;
        break;
    }
}

export function parseStateIgnoresComma(parser: UcParser, token: Token) {
    const state = parser.currentClassState;
    if (!state) {
        parser.result.errors.push({
            message: "Invalid parser state inside state ignores.",
            token: token,
        });
        parseStateBody(parser, token);
        return;
    }

    switch(token.text)
    {
    case ',':
        parser.rootFn = parseStateIgnores;
        break;

    case ';':
        parser.rootFn = parseStateBody;
        break;
        
    default:
        parser.result.errors.push({
            message: "Expected comma between ignored items.",
            token: token,
        });
        parseStateIgnores(parser, token);
        return;
    }
}