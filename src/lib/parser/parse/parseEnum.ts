import { ParserToken as Token } from "../";
import { SemanticClass as C } from "../";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";

export function parseEnumDeclaration(parser: UcParser, token: Token) {
    const result = parser.lastEnum;
    result.name = token;
    parser.rootFn = parseEnumNameParsed;
    token.type = C.EnumDeclaration;
}
function parseEnumNameParsed(parser: UcParser, token: Token) {
    if (token.text === "{") {
        parser.rootFn = parseEnumBody;
        parser.lastEnum.firstBodyToken = token;
        return;
    }
}
export function parseEnumBody(parser: UcParser, token: Token) {
    if (token.text === "}") {
        parser.rootFn = parseEnumBodyClosed;
        return;
    }
    const enumResult = parser.lastEnum;
    enumResult.enumeration.push(token);
    token.type = C.EnumMember,
    parser.rootFn = parseEnumBodyParedName;
}
export function parseEnumBodyClosed(parser: UcParser, token: Token) {
    switch (token.text) {
    case ';':
        parser.rootFn = parseNoneState;
        break;
    }
}
function parseEnumBodyParedName(parser: UcParser, token: Token) {
    parser.lastEnum.lastToken = token;
    switch (token.text) {
    case ',':
        parser.rootFn = parseEnumBody;
        break;
    case '}':
        parser.rootFn = parseEnumBodyClosed;
        break;
    }
}
