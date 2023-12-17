import { foldConstants } from "./rules";
import { SourceTransformer } from "./SourceTransformer";


export const standardTranspiler: SourceTransformer = (editor, uc) => {
    const transformers = [
        foldConstants
    ];
    for (const transformer of transformers){
        transformer(editor, uc);
    }
};