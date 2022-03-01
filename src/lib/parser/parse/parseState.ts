import { SemanticClass, UcParser } from "..";
import { Token } from "../types";
import { parseNoneState } from "./parseNoneState";

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
    case "}":
        parser.rootFn = parseNoneState;
        break;
    }
}