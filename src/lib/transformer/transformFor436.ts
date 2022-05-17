import { foldConstants } from "./rules";
import { SourceTransformer } from "./SourceTransformer";


export const transformFor436: SourceTransformer = (editor, uc) => {
    const transformers = [
        foldConstants
    ];
    for (const transformer of transformers){
        transformer(editor, uc);
    }
};