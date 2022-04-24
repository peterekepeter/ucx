import { replaceArrayCountExpressionWithLiteral } from "./rules";
import { SourceTransformer } from "./SourceTransformer";


export const transformFor436: SourceTransformer = (editor, uc) => {
    const transformers = [
        replaceArrayCountExpressionWithLiteral
    ];
    for (const transformer of transformers){
        transformer(editor, uc);
    }
};