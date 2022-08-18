import { Token } from "../types";
import { UnrealClassFunction } from "../ast/UnrealClassFunction";
import { UcParser } from "../UcParser";

export function resolveFunctionModifiers(parser: UcParser): Partial<UnrealClassFunction> {
    let modifiers: Token[] = parser.modifiers;
    let isStatic = false;
    let isSimulated = false;
    let isFinal = false;
    let isPrivate = false;
    let isLatent = false;
    let isNative = false;
    let isIterator = false;
    for (const modifier of modifiers) {
        switch (modifier.textLower) {
        case "static":
            isStatic = true;
            break;
        case "simulated":
            isSimulated = true;
            break;
        case "final":
            isFinal = true;
            break;
        case "private":
            isPrivate = true;
            break;
        case "latent":
            isLatent = true;
            break;
        case "native":
            isNative = true;
            break;
        case "iterator":
            isIterator = true;
            break;
        default:
            parser.result.errors.push({
                message: 'Uknown function modifiers',
                token: modifier,
            });
            break;
        }
    }
    return {
        isStatic,
        isSimulated,
        isFinal,
        isPrivate,
        isLatent,
        isNative,
        isIterator,
    };
}
