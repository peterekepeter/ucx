import { parseEnumBegin } from "./parseEnum";
import { parseConstDeclaration } from "./parseConst";
import { parseClassName } from "./parseClass";
import { Token } from "../types";
import { SemanticClass as C } from "../token/SemanticClass";
import { parseFnBegin } from "./parseFunction";
import { UcParser } from "../UcParser";
import { parseDefaultProperties } from "./parseDefaultProperties";
import { parseExec } from "./parseExec";
import { parseState, parseStateBody } from "./parseState";
import { clearModifiers } from "./clearModifiers";
import { parseReplicationBlockBegin } from "./parseReplication";
import { parseVarBegin } from "./parseVar";
import { parseStructBegin } from "./parseStruct";


export function parseNoneState(parser: UcParser, token: Token) {
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
    switch (token.textLower) {

    case 'native':
        token.type = C.Keyword;
        parser.modifiers.push(token);
        parser.rootFn = parseNativeModifier;
        break;

    case 'auto':
    case 'final':
    case 'simulated':
    case 'static':
    case 'latent':
    case 'private':
    case 'iterator':
    case 'singular':
        token.type = C.Keyword;
        parser.modifiers.push(token);
        break;

    case 'class':
        parser.rootFn = parseClassName;
        parser.result.classFirstToken = token;
        parser.result.classDeclarationFirstToken = token;
        token.type = C.Keyword;
        clearModifiers(parser);
        break;

    case 'var': parseVarBegin(parser, token); break;
    case 'struct': parseStructBegin(parser, token); break;
    case 'enum': parseEnumBegin(parser, token); break;

    case 'const':
        parser.rootFn = parseConstDeclaration;
        parser.result.constants.push({
            name: null,
            value: null
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
        token.type = C.Keyword;
        break;

    case 'state':
        parser.result.states.push({
            name: null,
            functions: [],
            body: [],
            ignores: [],
            bodyFirstToken: null,
            bodyLastToken: null,
        });
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
}

function parseNetiveModifierEnd(parser: UcParser, token: Token) {
    if (token.text !== ')'){
        parser.result.errors.push({ 
            token, message: "Expected closing parenthesis for native modifier." });
    }
    parser.rootFn = parseNoneState;
}