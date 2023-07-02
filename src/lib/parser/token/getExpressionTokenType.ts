import { Token } from "../types";
import { SemanticClass } from "./SemanticClass";

export function getExpressionTokenType(token: Token): DetectedExpressionTypes {
    const text = token.text;
    if (text.startsWith('"')) {
        return SemanticClass.LiteralString;
    }
    else if (text.startsWith("'")) {
        return SemanticClass.LiteralName;
    }
    else if (NUMERIC.test(text)) {
        return SemanticClass.LiteralNumber;
    }
    else if (LANGUAGE_CONSTANTS.test(text)) {
        return SemanticClass.LanguageConstant;
    }
    else if (OPERATORS.test(text)){
        return SemanticClass.Operator;
    }
    else if (IDENTIFIERS.test(text)) {
        return SemanticClass.Identifier;
    }
    else {
        return SemanticClass.None;
    }
}

const NUMERIC = /^[+-]?[0-9]/;
const LANGUAGE_CONSTANTS = /^(true|false|none)$/i;
const OPERATORS = /^(?:[-+=*/<>!@$]|[<>=!~]=|\+\+|--|&&|\|\||new|dot|cross)$/i;
const IDENTIFIERS = /^[a-z_]/i;

type DetectedExpressionTypes 
    = SemanticClass.LiteralString   
    | SemanticClass.LiteralNumber
    | SemanticClass.LiteralName
    | SemanticClass.Identifier
    | SemanticClass.Operator
    | SemanticClass.LanguageConstant
    | SemanticClass.None;