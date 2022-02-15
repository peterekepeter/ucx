import { getExpressionTokenType } from "./getExpressionTokenType";
import { SemanticClass } from "./SemanticClass";
import { ParserToken } from "./ParserToken";


export class LazyParserToken implements ParserToken {

    private _lower: string | null = null;
    private _type: SemanticClass | null = null;

    get textLower() {
        if (this._lower == null) {
            this._lower = this.text.toLowerCase();
        }
        return this._lower;
    }

    get type(): SemanticClass {
        if (this._type == null) {
            this._type = getExpressionTokenType(this);
        }
        return this._type;
    }

    set type(value: SemanticClass) {
        this._type = value;
    }

    constructor(
        public readonly line: number,
        public readonly position: number,
        public readonly text: string,
        public readonly index: number
    ) {
    }

}
