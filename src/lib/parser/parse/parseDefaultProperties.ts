import { SemanticClass as C } from "..";
import { Token } from "../types";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";

/** after keyword defaultproperties */
export function parseDefaultProperties(parser: UcParser, token: Token) {
    switch (token.text) {
    case '{':
        parser.rootFn = parseProperty;
        break;
    default: 
        parser.rootFn = parseProperty;
        parser.result.errors.push({ token, message: 'Expected "{" after keyword'});
        break;
    }
}

function parseProperty(parser: UcParser, token: Token) {
    switch (token.text){
    case "}":
        parser.rootFn = parseNoneState;
        break;
    default: 
        const prop = parser.lastDefaultProperty;
        parser.result.defaultProperties.push({
            name: token,
            value: null
        });
        parser.rootFn = parsePropertyEquals;
        token.type = C.ClassVariable;
        break;
    }
}

function parsePropertyEquals(parser: UcParser, token: Token)
{
    switch (token.text) {
    case '=':
        parser.rootFn = parsePropertyValue;
        token.type = C.Operator;
        break;
    default:
        parser.result.errors.push({ token, message: "Expecting '=' to assign value" });
        parser.rootFn = parseProperty;
        parseProperty(parser, token);
        break;
    }
}

function parsePropertyValue(parser: UcParser, token: Token)
{
    switch (token.text){
    default:
        parser.lastDefaultProperty.value = token;
        parser.rootFn = parseProperty;
        break;
    }
}