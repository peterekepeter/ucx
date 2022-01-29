import { SemanticClass } from "./SemanticClass";
import { Token } from "./UcParser";

export function getExpressionTokenType(token: Token): SemanticClass {
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
    else if (/^[a-z_]/i) {
        return SemanticClass.Identifier;
    }

    else {
        return SemanticClass.None;
    }
}
