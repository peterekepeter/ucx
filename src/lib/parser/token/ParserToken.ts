import { SemanticClass } from "./SemanticClass";

export interface ParserToken {
    readonly text: string;
    readonly line: number;
    readonly position: number;
    type: SemanticClass;
    readonly index: number;
    readonly textLower: string;
}

