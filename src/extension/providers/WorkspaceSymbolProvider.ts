import { vscode } from '../vscode';
import { db, symbolCache } from '../state';
import { getSymbolsFromAst } from '../utils';
import { parseConfiguration } from '../config';

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {

    async provideWorkspaceSymbols(query: string, token: vscode.CancellationToken) {    
        const vscodeConfig = vscode.workspace.getConfiguration("ucx");
        const config = parseConfiguration(vscodeConfig);

        const f = await db.getAllFileEntries(token, { 
            fromWorkspace: true, 
            fromLibrary: config.searchLibrarySymbols,
        });
        if (token.isCancellationRequested) return;

        const regex = new RegExp(query.split('').map(c=>`[${c}]`).join('.*?'), 'i');

        const fuzzy = new Array<vscode.SymbolInformation>();
        const exact = new Array<vscode.SymbolInformation>();
        const files = [...f];
        for (const file of files) {
            const fileVersion = file.version;
            const cacheKey = file.url;
            let symbols = symbolCache.getSymbols(cacheKey, fileVersion);
            if (!symbols) {
                symbols = getSymbolsFromAst(file.ast, vscode.Uri.parse(file.url));
                symbolCache.putSymbols(cacheKey, fileVersion, symbols);
            }
            for (const symbol of symbols) {
                if (regex.test(symbol.name)) {
                    if (query.length === symbol.name.length) {
                        exact.push(symbol);
                    }
                    else {
                        fuzzy.push(symbol);
                    }
                }
            }
        }
        return [
            ...exact,
            ...fuzzy,
        ];
    }

}
