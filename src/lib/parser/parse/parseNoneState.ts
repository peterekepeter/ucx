import { parseVarDeclaration } from "./parseVar";
import { parseEnumDeclaration } from "./parseEnum";
import { parseConstDeclaration } from "./parseConst";
import { parseClassName } from "./parseClass";
import { Token } from "../types";
import { SemanticClass as C } from "../token/SemanticClass";
import { parseFnDeclaration } from "./parseFunction";
import { UcParser } from "../UcParser";
import { parseDefaultProperties } from "./parseDefaultProperties";
import { parseExec } from "./parseExec";
import { parseState, parseStateBody } from "./parseState";
import { clearModifiers } from "./clearModifiers";
import { resolveFunctionModifiers } from "./resolveFunctionModifiers";
import { parseStructDeclaration } from "./parseStruct";
import { parseReplicationBlockBegin } from "./parseReplication";


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
    case 'private':
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

    case 'var':
        parser.rootFn = parseVarDeclaration;
        parser.result.variables.push({
            name: null,
            type: null,
            isConst: false,
            isTransient: false,
            group: null,
            isConfig: false,
            firstToken: token,
            lastToken: token,
            arrayCount: null,
            arrayCountToken: null,
            localized: false,
            template: null,
            arrayCountExpression: null,
        });
        token.type = C.Keyword;
        clearModifiers(parser);
        break;

    case 'struct':
        parser.rootFn = parseStructDeclaration;
        parser.result.structs.push({
            name: null,
            firstToken: token,
            lastToken: token,
            members: [],
        });
        token.type = C.Keyword;
        clearModifiers(parser);
        break;

    case 'enum':
        parser.rootFn = parseEnumDeclaration;
        parser.result.enums.push({
            name: null,
            firstToken: token,
            firstBodyToken: token,
            lastToken: token,
            enumeration: [],
        });
        token.type = C.Keyword;
        clearModifiers(parser);
        break;

    case 'const':
        parser.rootFn = parseConstDeclaration;
        parser.result.constants.push({
            name: null,
            value: null
        });
        token.type = C.Keyword;
        clearModifiers(parser);
        break;

    case 'event':
    case 'function':
        parser.rootFn = parseFnDeclaration;
        parser.result.functions.push({
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
        token.type = C.Keyword;
        clearModifiers(parser);
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