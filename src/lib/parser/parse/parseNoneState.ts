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
import { UnrealClassFunction } from "../ast/UnrealClassFunction";
import { parseState } from "./parseState";


export function parseNoneState(parser: UcParser, token: Token) {
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

    case 'auto':
    case 'final':
    case 'simulated':
    case 'static':
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
            name: null
        });
        parser.rootFn = parseState;
        token.type = C.Keyword;
        clearModifiers(parser);
        break;

    default:
        parser.result.errors.push({ 
            token, message: "Reached unexpected token." });
        break;
    }
}

function clearModifiers(parser: UcParser) {
    if (parser.modifiers.length > 0){
        parser.modifiers = [];
    }
}

function resolveFunctionModifiers(modifiers: Token[]): Partial<UnrealClassFunction> {
    let isStatic = false; 
    let isSimulated = false; 
    let isFinal = false; 
    for (const modifier of modifiers) {
        switch (modifier.textLower){
        case "static":
            isStatic = true;
            break;
        case "simulated":
            isSimulated = true;
            break;
        case "final":
            isFinal = true;
            break;
        }
    }
    return {
        isStatic,
        isSimulated,
        isFinal
    };
}