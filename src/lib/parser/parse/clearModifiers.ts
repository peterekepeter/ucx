import { UcParser } from "../UcParser";

export function clearModifiers(parser: UcParser) {
    if (parser.modifiers.length > 0) {
        parser.modifiers = [];
    }
}
