import { ParserToken, SemanticClass } from "../types";
import { UcParser, parseNoneState } from "../UcParser";

export function parseEnumDeclaration(parser: UcParser, token: ParserToken) {
    const result = parser.lastEnum;
    result.name = token;
    parser.rootFn = parseEnumNameParsed;
    token.classification = SemanticClass.EnumDeclaration;
}
function parseEnumNameParsed(parser: UcParser, token: ParserToken) {
    if (token.text === "{") {
        parser.rootFn = parseEnumBody;
        return;
    }
}
export function parseEnumBody(parser: UcParser, token: ParserToken) {
    if (token.text === "}") {
        parser.rootFn = parseEnumBodyClosed;
        return;
    }
    const enumResult = parser.lastEnum;
    enumResult.enumeration.push(token);
    token.classification = SemanticClass.EnumMember,
    parser.rootFn = parseEnumBodyParedName;
}
export function parseEnumBodyClosed(parser: UcParser, token: ParserToken) {
    switch (token.text) {
    case ';':
        parser.rootFn = parseNoneState;
        break;
    }
}
function parseEnumBodyParedName(parser: UcParser, token: ParserToken) {
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
