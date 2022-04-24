import { UnrealClass } from "../parser";
import { SourceEditor } from "./SourceEditor";


export type SourceTransformer = (editor: SourceEditor, uc: UnrealClass) => void;
