import { getExpressionTokenType } from "./classifyTokenType";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";
import { ParserToken, SemanticClass } from "../types";

export function parseConstDeclaration(parser: UcParser, token: ParserToken) {
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
        token.classification = SemanticClass.ClassConstant;
        constant.name = token;
        parser.rootFn = parseConstParsedName;
        break;
    }
}
function parseConstParsedName(parser: UcParser, token: ParserToken) {
    switch (token.text) {
    case '=':
        parser.rootFn = parseConstExpectValue;
        token.classification = SemanticClass.AssignmentOperator;
        break;
    default:
        parser.result.errors.push({ token, message: `Expecting "=" operator.` });
        parser.rootFn = parseNoneState;
        break;
    }
}
function parseConstExpectValue(parser: UcParser, token: ParserToken) {
    switch (token.text) {
    case ';':
        parser.result.errors.push({ token, message: 'Expecting constant value.' });
        parser.rootFn = parseNoneState;
        break;
    default:
        const constant = parser.lastConst;
        constant.value = token;
        const expressionType = getExpressionTokenType(token);
        token.classification = expressionType;
        parser.rootFn = parseConstParsedValue;
        break;
    }
}
function parseConstParsedValue(parser: UcParser, token: ParserToken) {
    if (token.text === ';') {
        parser.rootFn = parseNoneState;
    } else {
        parser.result.errors.push({ token, message: 'Expected ";" after constant declaration.' });
        // try to recover
        parseNoneState(parser, token);
    }
}
