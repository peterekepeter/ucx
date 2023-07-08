import { SemanticClass as C } from "..";
import { UnrealClassExpression } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";

/** after keyword defaultproperties */
export function parseDefaultProperties(parser: UcParser, token: Token) {
    switch (token.text) {
    case '{':
        parser.expressionTokens = [];
        parser.result.defaultPropertiesFirstToken = token;
        parser.result.defaultPropertiesLastToken = token;
        parser.rootFn = parseProperty;
        break;
    default: 
        parser.result.errors.push({ token, message: 'Expected "{" after keyword'});
        parseProperty(parser, token);
        break;
    }
}

function parseProperty(parser: UcParser, token: Token) {
    switch (token.text){
    case "}":
        parser.result.defaultPropertiesLastToken = token;
        parser.rootFn = parseNoneState;
        break;
    default: 
        parser.result.defaultProperties.push({
            name: token,
            value: null,
            arrayIndex: null
        });
        parser.rootFn = parseAfterPropertName;
        token.type = C.ClassVariable;
        break;
    }
}

function parseAfterPropertName(parser: UcParser, token: Token)
{
    switch (token.text) {
    case '}':
        parser.result.errors.push({ token, message: "Expecting '=' or '(' to assign value" });
        parser.rootFn = parseNoneState;
        break;
    case '=':
        parser.rootFn = parsePropertyValue;
        token.type = C.Operator;
        break;
    case "(":
        parser.rootFn = parseArrayPropertyIndex;
        break;
    default:
        parser.result.errors.push({ token, message: "Expecting '=' or '(' to assign value" });
        parser.rootFn = parseProperty;
        parseProperty(parser, token);
        break;
    }
}

function parseArrayPropertyIndex(parser: UcParser, token: Token)
{
    switch (token.text) {
    case '}':
        parser.result.errors.push({ token, message: "Expecting index number" });
        parser.rootFn = parseNoneState;
        break;
    default:
        parser.lastDefaultProperty.arrayIndex = token;
        parser.rootFn = parseArrayPropertyAfterIndex;
        break;
    }
}

function parseArrayPropertyAfterIndex(parser: UcParser, token: Token)
{
    switch (token.text) {
    case '}':
        parser.result.errors.push({ token, message: "Expecting ')' to assign value" });
        parser.rootFn = parseNoneState;
        break;
    case ')':
        parser.rootFn = parsePropertyEquals;
        break;
    default:
        parser.result.errors.push({ token, message: "Expecting ')' to assign value" });;
        parser.rootFn = parseProperty;
        break;
    }
}


function parsePropertyEquals(parser: UcParser, token: Token)
{
    switch (token.text) {
    case '}':
        parser.result.errors.push({ token, message: "Expecting '=' to assign value" });
        parser.rootFn = parseNoneState;
        break;
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
    case '}':
        parser.result.defaultPropertiesLastToken = token;
        parser.lastDefaultProperty.value = resolveDefaultExpression(parser.expressionTokens);
        parser.expressionTokens.length = 0;
        parser.rootFn = parseNoneState;
        break;
    default:
        if (parser.lastDefaultProperty?.name?.line !== token.line)
        {
            const resolved = resolveDefaultExpression(parser.expressionTokens);
            parser.lastDefaultProperty.value = resolved;
            parser.expressionTokens = [];
            parser.rootFn = parseProperty;
            parseProperty(parser,token);
        }
        else {
            parser.expressionTokens.push(token);
        }
        break;
    }
}

function resolveDefaultExpression(tokens: Token[]): UnrealClassExpression | Token | null
{
    if (tokens.length === 0) {
        return null; // empty 
    }
    else if (tokens.length === 1) {
        const token = tokens[0];
        switch (token.type) {
        case C.LiteralName:
        case C.LiteralNumber:
        case C.LiteralString:
        case C.LanguageConstant:
        case C.EnumMember: 
        case C.ClassConstant: 
        case C.Identifier: // can reference a n enum or constant
            return token;
        }
    }
    else if (tokens.length === 2){
        const [first, second] = tokens;
        if (first.type === C.Identifier && second.type === C.LiteralName){
            first.type = C.ClassReference;
            second.type = C.ObjectReferenceName;
            return {
                op: first,
                args: [second],
                argsFirstToken: first,
                argsLastToken: second,
            };
        }
    }
    else {
        if (tokens[0]?.text === '(' && tokens[tokens.length-1]?.text === ')'){
            // not correct but it's something
            return {
                op: tokens[0],
                args: tokens.slice(1, tokens.length-1),
                argsFirstToken: tokens[0],
                argsLastToken: tokens[tokens.length-1],
            };
        }
    }
    return null;
}