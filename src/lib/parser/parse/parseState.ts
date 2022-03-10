import { SemanticClass, UcParser } from "..";
import { Token } from "../types";
import { clearModifiers } from "./clearModifiers";
import { parseFnDeclaration } from "./parseFunction";
import { parseNoneState } from "./parseNoneState";
import { resolveFunctionModifiers } from "./resolveFunctionModifiers";

export function parseState(parser: UcParser, token: Token) {
    parser.lastState.name = token;
    token.type = SemanticClass.StateDeclaration;
    parser.rootFn = parseStateOpenBody; 
}

function parseStateOpenBody(parser: UcParser, token: Token) {
    if (token.text !== "{")
    {
        parser.result.errors.push({ token, message: "Expected '{'"});
    }
    parser.rootFn = parseStateBody;
}

function parseStateBody(parser: UcParser, token: Token) {
    switch (token.textLower){

    case 'event':
    case 'function':
        parser.rootFn = parseFnDeclaration;
        parser.lastState.functions.push({
            name: null,
            locals: [],
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null,
            ...resolveFunctionModifiers(parser.modifiers),
            returnType: null,
            fnArgs: [],
            fnArgsFirstToken: null,
            fnArgsLastToken: null
        });
        token.type = SemanticClass.Keyword;
        clearModifiers(parser);
        break;
        
    case "}":
        parser.currentClassState = null;
        parser.rootFn = parseNoneState;
        break;
    }
}