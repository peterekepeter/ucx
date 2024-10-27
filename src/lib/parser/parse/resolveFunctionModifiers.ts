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
    let isSingular = false;
    let isExec = false;
    for (const modifier of modifiers) {
        switch (modifier.textLower) {
        case "exec":
            isExec = true;
            break;
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
        case "singular":
            isSingular = true;
            break;
        default:
            parser.result.errors.push({
                message: 'Unknown function modifiers',
                token: modifier,
            });
            break;
        }
    }
    return {
        isExec, 
        isStatic,
        isSimulated,
        isFinal,
        isPrivate,
        isLatent,
        isNative,
        isIterator,
        isSingular,
        nativeIndex: parser.nativeModifierIndex,
    };
}
