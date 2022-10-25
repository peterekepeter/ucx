import { Token } from "../types";
import { SemanticClass } from "./SemanticClass";

type DetectedExpressionTypes 
    = SemanticClass.LiteralString   
    | SemanticClass.LiteralNumber
    | SemanticClass.LiteralName
    | SemanticClass.Identifier
    | SemanticClass.Operator
    | SemanticClass.LanguageConstant
    | SemanticClass.None;

export function getExpressionTokenType(token: Token): DetectedExpressionTypes {
    const text = token.text;
    if (text.startsWith('"')) {
        return SemanticClass.LiteralString;
    }
    else if (text.startsWith("'")) {
        return SemanticClass.LiteralName;
    }
    else if (/^[0-9]/.test(text)) {
        return SemanticClass.LiteralNumber;
    }
    else if (/^(true|false|none)$/i.test(text)) {
        return SemanticClass.LanguageConstant;
    }
    else if(/^new$/i.test(text)) {
        return SemanticClass.Operator;
    }
    else if (/^[a-z_]/i.test(text)) {
        return SemanticClass.Identifier;
    }
    else if (/^[-+=*/<>!]|[<>=!~]=|\+\+|--|\&\&|\|\|$/.test(text)){
        return SemanticClass.Operator;
    }
    else {
        return SemanticClass.None;
    }
}
