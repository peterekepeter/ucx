import { parseVarDeclaration } from "./parseVar";
import { parseEnumDeclaration } from "./parseEnum";
import { parseConstDeclaration } from "./parseConst";
import { parseClassName } from "./parseClass";
import { SemanticClass, Token } from "../types";
import { parseFnDeclaration } from "./parseFunction";
import { UcParser } from "../UcParser";


export function parseNoneState(parser: UcParser, token: Token) {
    switch (token.text.toLocaleLowerCase()) {

    case 'class':
        parser.rootFn = parseClassName;
        parser.result.classFirstToken = token;
        parser.result.classDeclarationFirstToken = token;
        token.classification = SemanticClass.Keyword;
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
        token.classification = SemanticClass.Keyword;
        break;

    case 'enum':
        parser.rootFn = parseEnumDeclaration;
        parser.result.enums.push({
            name: null,
            firstToken: token,
            lastToken: token,
            enumeration: [],
        });
        token.classification = SemanticClass.Keyword;
        break;

    case 'const':
        parser.rootFn = parseConstDeclaration;
        parser.result.constants.push({
            name: null,
            value: null
        });
        token.classification = SemanticClass.Keyword;
        break;

    case 'function':
        parser.rootFn = parseFnDeclaration;
        parser.result.functions.push({
            name: null,
            locals: [],
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null
        });
        token.classification = SemanticClass.Keyword;
        break;

    default:
        parser.result.errors.push({ token, message: "Reached unexpected token." });
        break;
    }
}
