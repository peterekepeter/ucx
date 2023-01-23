import { ParserToken as Token } from "../";
import { SemanticClass as C } from "../";
import { UcParser } from "../UcParser";
import { clearModifiers } from "./clearModifiers";
import { parseNoneState } from "./parseNoneState";
import { continueVarDelcarationFromTypeDeclaration, hasIncompleteVarDeclaration } from "./parseVar";

export function parseEnumBegin(parser: UcParser, token: Token)
{
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
}

function parseEnumDeclaration(parser: UcParser, token: Token) {
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

function parseEnumBody(parser: UcParser, token: Token) {
    if (token.text === "}") {
        parser.rootFn = parseEnumBodyClosed;
        return;
    }
    const enumResult = parser.lastEnum;
    enumResult.enumeration.push(token);
    token.type = C.EnumMember,
    parser.rootFn = parseEnumBodyParedName;
}

function parseEnumBodyClosed(parser: UcParser, token: Token) {
    if (hasIncompleteVarDeclaration(parser)){
        const typename = parser.lastEnum.name;
        if (!typename )
        {
            parser.result.errors.push({ 
                message: 'Enum typename not found!',
                token
            });
            parser.rootFn = parseNoneState;
            return;
        }
        else {
            continueVarDelcarationFromTypeDeclaration(parser, typename, token);
            return;
        }
    }
    switch (token.text) {
    case ';':
        parser.rootFn = parseNoneState;
        break;
    default: 
        parser.result.errors.push({
            message: 'Expected semicolon after enum body.',
            token,
        });
        parser.rootFn = parseNoneState;
        parseNoneState(parser, token);
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
