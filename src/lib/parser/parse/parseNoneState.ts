import { parseVarDeclaration } from "./parseVar";
import { parseEnumDeclaration } from "./parseEnum";
import { parseConstDeclaration } from "./parseConst";
import { parseClassName } from "./parseClass";
import { Token } from "../types";
import { SemanticClass } from "../token/SemanticClass";
import { parseFnDeclaration } from "./parseFunction";
import { UcParser } from "../UcParser";


export function parseNoneState(parser: UcParser, token: Token) {
    switch (token.textLower) {

    case 'static':
        token.type = SemanticClass.Keyword;
        parser.modifiers.push(token);
        break;

    case 'class':
        parser.rootFn = parseClassName;
        parser.result.classFirstToken = token;
        parser.result.classDeclarationFirstToken = token;
        token.type = SemanticClass.Keyword;
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
        });
        token.type = SemanticClass.Keyword;
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
        token.type = SemanticClass.Keyword;
        clearModifiers(parser);
        break;

    case 'const':
        parser.rootFn = parseConstDeclaration;
        parser.result.constants.push({
            name: null,
            value: null
        });
        token.type = SemanticClass.Keyword;
        clearModifiers(parser);
        break;

    case 'function':
        parser.rootFn = parseFnDeclaration;
        parser.result.functions.push({
            name: null,
            locals: [],
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null,
            isStatic: parser.modifiers.findIndex(m => m.textLower === 'static') !== -1,
        });
        token.type = SemanticClass.Keyword;
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

