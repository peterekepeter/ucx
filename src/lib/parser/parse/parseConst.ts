import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";
import { SemanticClass as C } from "../token/SemanticClass";
import { ParserToken as Token } from "..";
import { resolveExpression } from "./resolveExpression";

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
        parser.clearExpressionTokens();
        parser.rootFn = parseConstValue;
        token.type = C.AssignmentOperator;
        break;
    default:
        parser.result.errors.push({ token, message: `Expecting "=" operator.` });
        parser.rootFn = parseNoneState;
        break;
    }
}
function parseConstValue(parser: UcParser, token: Token) {
    const constant = parser.lastConst;
    switch (token.text) {
    case 'native':
    case 'class':
    case 'var':
    case 'struct':
    case 'enum':
    case 'const':
    case 'function':
    case 'state':
        parser.result.errors.push({ token, message: 'Expected ";" after constant declaration.' });
        resolveConstExpressionAndClearExpressionTokens(parser);
        parseNoneState(parser, token);
        break;
    case ';':
        resolveConstExpressionAndClearExpressionTokens(parser);
        parser.rootFn = parseNoneState;
        break;
    default:
        parser.expressionTokens.push(token);
        break;
    }
}

function parseConstParsedValue(parser: UcParser, token: Token) {
    if (token.text === ';') {
        parser.rootFn = parseNoneState;
    } else {
        // try to recover
        parseNoneState(parser, token);
    }
}

function resolveConstExpressionAndClearExpressionTokens(parser: UcParser){
    const constant = parser.lastConst;
    if (parser.expressionTokens.length === 0 && constant.name) {
        parser.result.errors.push({ 
            token: constant.name, 
            message: 'Missing constant value.' 
        });
        return;
    }
    constant.valueExpression = resolveExpression(parser.expressionTokens);
    if ('text' in constant.valueExpression){
        constant.value = constant.valueExpression;
    }
    parser.expressionTokens.length = 0;
}