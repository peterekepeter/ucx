import { VsCodeClassDatabase } from "./utils";
import { SymbolCache } from "./utils/SymbolCache";

export let activatedAt: number; // milliseconds since extension was activated
export let db: VsCodeClassDatabase;
export let symbolCache: SymbolCache;

export function initializeState(){
    activatedAt = Date.now();
    db = new VsCodeClassDatabase();
    symbolCache = new SymbolCache();
}
