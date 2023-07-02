import { UcParser } from "../UcParser";
import { ParserToken, SemanticClass } from "../token";

export function clearModifiers(parser: UcParser) {
    if (parser.modifiers.length > 0) {
        parser.modifiers = [];
    }
}

const modifierRegex = /^(?:auto|exec|final|simulated|static|latent|private|iterator|singular)$/i;

export function isModifier(token: ParserToken): boolean {
    return modifierRegex.test(token.text);
}

export function parseModifier(parser: UcParser, token: ParserToken)
{
    token.type = SemanticClass.Keyword;
    parser.modifiers.push(token);
}


