import { vscode } from "../vscode";

export class SymbolCache {
    store: Record<string, { 
        symbolsVersion: number;
        symbols: vscode.SymbolInformation[]; 
    }> = {};

    getSymbols(key: string, fileVersion: number) {
        const entry = this.store[key];
        if (!entry || entry.symbolsVersion < fileVersion) 
            return null;
        return entry.symbols;
    }

    putSymbols(key: string, symbolsVersion: number, symbols: vscode.SymbolInformation[]) {
        const entry = this.store[key];
        this.store[key] = { ...entry, symbols, symbolsVersion };
    }
};