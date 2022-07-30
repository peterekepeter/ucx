import { SemanticClass as C } from "..";
import { UnrealClassExpression } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";

/** after keyword defaultproperties */
export function parseDefaultProperties(parser: UcParser, token: Token) {
    switch (token.text) {
    case '{':
        parser.result.defaultPropertiesFirstToken = token;
        parser.result.defaultPropertiesLastToken = token;
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
    default:
        parser.lastDefaultProperty.arrayIndex = token;
        parser.rootFn = parseArrayPropertyAfterIndex;
        break;
    }
}

function parseArrayPropertyAfterIndex(parser: UcParser, token: Token)
{
    switch (token.text) {
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
    let expression: UnrealClassExpression | Token | null;
    switch (token.text){
    case '}':
        parser.result.defaultPropertiesLastToken = token;
        expression = tryResolveDefaultExpression(parser.expressionTokens);
        if (expression != null){
            parser.lastDefaultProperty.value = expression;
        }
        else {
            for(const token of parser.expressionTokens) {
                parser.result.errors.push({
                    token, message: 'Failed to parse default property value' 
                });
            }
        }
        parser.expressionTokens = [];
        parser.rootFn = parseNoneState;
        break;
    default:
        if (token.type === C.Identifier)
        {
            // token can be next default property name
            const resolved = tryResolveDefaultExpression(parser.expressionTokens);
            if (resolved){
                parser.lastDefaultProperty.value = resolved;
                parser.expressionTokens = [];
                parser.rootFn = parseProperty;
                parseProperty(parser,token);
                return;
            }
        }
        // could not resolve expression
        parser.expressionTokens.push(token);
        break;
    }
}

function tryResolveDefaultExpression(tokens: Token[]): UnrealClassExpression | Token | null
{
    if (tokens.length === 1) {
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