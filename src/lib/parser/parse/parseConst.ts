import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";
import { SemanticClass as C } from "../token/SemanticClass";
import { ParserToken as Token } from "..";

export function parseConstDeclaration(parser: UcParser, token: Token) {
    switch (token.text) {
    case ';':
        parser.result.errors.push({
            token,
            message: "Expected constant name."
        });
        parser.rootFn = parseNoneState;
        break;
    default:
        const constant = parser.lastConst;
        token.type = C.ClassConstant;
        constant.name = token;
        parser.rootFn = parseConstParsedName;
        break;
    }
}
function parseConstParsedName(parser: UcParser, token: Token) {
    switch (token.text) {
    case '=':
        parser.rootFn = parseConstExpectValue;
        token.type = C.AssignmentOperator;
        break;
    default:
        parser.result.errors.push({ token, message: `Expecting "=" operator.` });
        parser.rootFn = parseNoneState;
        break;
    }
}
function parseConstExpectValue(parser: UcParser, token: Token) {
    switch (token.text) {
    case ';':
        parser.result.errors.push({ token, message: 'Expecting constant value.' });
        parser.rootFn = parseNoneState;
        break;
    default:
        const constant = parser.lastConst;
        constant.value = token;
        parser.rootFn = parseConstParsedValue;
        break;
    }
}
function parseConstParsedValue(parser: UcParser, token: Token) {
    if (token.text === ';') {
        parser.rootFn = parseNoneState;
    } else {
        parser.result.errors.push({ token, message: 'Expected ";" after constant declaration.' });
        // try to recover
        parseNoneState(parser, token);
    }
}
