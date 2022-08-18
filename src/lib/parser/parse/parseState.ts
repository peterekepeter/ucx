import { SemanticClass, UcParser } from "..";
import { Token } from "../types";
import { parseFnBegin } from "./parseFunction";
import { parseNoneState } from "./parseNoneState";
import { parseStatement } from "./parseStatement";

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
    switch (token.textLower){

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