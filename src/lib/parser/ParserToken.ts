import { SemanticClass } from "./SemanticClass";


export interface ParserToken {
    text: string;
    line: number;
    position: number;
    classification: SemanticClass;
}
