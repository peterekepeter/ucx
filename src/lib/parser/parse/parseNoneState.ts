import { parseEnumKeyword } from "./parseEnum";
import { parseConstDeclaration } from "./parseConst";
import { parseClassName } from "./parseClass";
import { Token } from "../types";
import { SemanticClass as C } from "../token/SemanticClass";
import { parseFnBegin } from "./parseFunction";
import { UcParser } from "../UcParser";
import { parseDefaultProperties } from "./parseDefaultProperties";
import { parseExec } from "./parseExec";
import { parseState, parseStateBody } from "./parseState";
import { clearModifiers, isModifier, parseModifier } from "./parseModifiers";
import { parseReplicationBlockBegin } from "./parseReplication";
import { parseVarBegin } from "./parseVar";
import { parseStructBody, parseStructKeyword } from "./parseStruct";
import { createDefaultUnrealClassState } from "../ast";


export function parseNoneState(parser: UcParser, token: Token) {
    if (parser.currentStruct) {
        parser.rootFn = parseStructBody;
        parseStructBody(parser, token);
        return;
    }
    if (parser.currentClassState){
        parser.rootFn = parseStateBody;
        parseStateBody(parser, token);
        return;
    }
    if (token.textLower.startsWith('#exec')){
        parser.result.execInstructions.push({
            firstToken: token,
            lastToken: token
        });
        parser.rootFn = parseExec;
        token.type = C.ExecInstruction;
        return;
    }

    if (isModifier(token)){
        parseModifier(parser, token);
        return;
    }
    
    switch (token.textLower) {

    case 'native':
        token.type = C.Keyword;
        parser.modifiers.push(token);
        parser.rootFn = parseNativeModifier;
        break;

    case 'class':
        parser.rootFn = parseClassName;
        parser.result.classFirstToken = token;
        parser.result.classDeclarationFirstToken = token;
        token.type = C.Keyword;
        clearModifiers(parser);
        break;

    case 'var': parseVarBegin(parser, token); break;
    case 'struct': parseStructKeyword(parser, token); break;
    case 'enum': parseEnumKeyword(parser, token); break;

    case 'const':
        parser.rootFn = parseConstDeclaration;
        parser.result.constants.push({
            name: null,
            value: null,
            valueExpression: null,
        });
        token.type = C.Keyword;
        clearModifiers(parser);
        break;

    case 'operator':
    case 'preoperator':
    case 'postoperator':
    case 'event':
    case 'function':
        parseFnBegin(parser, token);
        break;

    case 'defaultproperties':
        parser.rootFn = parseDefaultProperties;
        parser.result.defaultPropertiesKeyword = token;
        token.type = C.Keyword;
        break;

    case 'state':
        parser.result.states.push(createDefaultUnrealClassState());
        parser.rootFn = parseState;
        token.type = C.Keyword;
        clearModifiers(parser);
        parser.currentClassState = parser.lastState;
        break;

    case 'replication':
        parseReplicationBlockBegin(parser, token);
        break;


    default:
        parser.result.errors.push({ 
            token, message: "Reached unexpected token." });
        break;
    }
}


function parseNativeModifier(parser: UcParser, token: Token) {
    switch (token.textLower){
    case '(':
        parser.rootFn = parseNativeModifierContent;
        break;
    default:
        parser.rootFn = parseNoneState;
        parseNoneState(parser, token);
        break;
    }

}

function parseNativeModifierContent(parser: UcParser, token: Token) {
    parser.rootFn = parseNetiveModifierEnd;
    const parsedInt = parseInt(token.text);
    if (isNaN(parsedInt)){
        parser.result.errors.push({ 
            token, message: "Expected number." });
    }
    else {
        parser.nativeModifierIndex = parsedInt;
    }
}

function parseNetiveModifierEnd(parser: UcParser, token: Token) {
    if (token.text !== ')'){
        parser.result.errors.push({ 
            token, message: "Expected closing parenthesis for native modifier." });
    }
    parser.rootFn = parseNoneState;
}