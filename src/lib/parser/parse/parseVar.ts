import { ParserToken, SemanticClass } from "../types";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";


export function parseVarDeclaration(parser: UcParser, token: ParserToken) {
    const variable = parser.lastVar;
    switch (token.text){
    case 'transient': 
        variable.isTransient = true;
        token.classification = SemanticClass.Keyword;
        break;
    case 'const':
        variable.isConst = true;
        token.classification = SemanticClass.Keyword;
        break;
    case 'config':
        variable.isConfig = true;
        token.classification = SemanticClass.Keyword;
        break;
    case '(':
        parser.rootFn = parseVarGroup;
        break;
    default:
        variable.type = token;
        token.classification = SemanticClass.TypeReference;
        parser.rootFn = parseVarName;
        break;
    }
}

function parseVarGroup(parser: UcParser, token: ParserToken) {
    const variable = parser.lastVar;
    variable.group = token;
    parser.rootFn = parseVarGroupNext;
}

function parseVarGroupNext(parser: UcParser, token: ParserToken) {
    switch (token.text) {
    case ")":
        parser.rootFn = parseVarDeclaration;
        break;
    default:
        parser.result.errors.push({ token, message: 'Expected ")"' });
        // try to recover
        parseVarDeclaration(parser, token);
        break;
    }
}

function parseVarName(parser: UcParser, token: ParserToken) {
    const variable = parser.lastVar;
    switch (token.text) {
    case ';':
        const message = 'Expected variable name isntead of ";"';
        parser.result.errors.push({ token, message });
        parser.rootFn = parseNoneState;
        variable.lastToken = token;
        break;
    default:
        token.classification = SemanticClass.ClassVariable;
        variable.name = token;
        parser.rootFn = parseVarNext;
        break;
    }
}

function parseVarNext(parser: UcParser, token: ParserToken) {
    const variable = parser.lastVar;
    switch (token.text) {
    case ';':
        variable.lastToken = token;
        parser.rootFn = parseNoneState;
        break;
    default:
        parser.result.errors.push({ token, message: 'Expecting ";" after variable name.' });
        break;
    }
}
