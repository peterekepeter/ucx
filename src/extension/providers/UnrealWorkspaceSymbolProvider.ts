import { vscode } from '../vscode';
import { symbolCache } from '../state';
import { getAst } from '../utils/getAst';
import { getSymbolsFromAst } from '../utils';

export class UnrealWorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {

    async provideWorkspaceSymbols(query: string, token: vscode.CancellationToken) {
        const regex = new RegExp(query.split('').join('.*?'), 'i');
        const files = await vscode.workspace.findFiles("**/*.uc");
        const results = new Array<Array<vscode.SymbolInformation>>();
        for (const file of files) {
            if (token.isCancellationRequested) {
                return results.flat();
            }
            const stats = await vscode.workspace.fs.stat(file);
            const fileVersion = stats.mtime;
            const cacheKey = file.toString();
            const cached = symbolCache.getSymbols(cacheKey, fileVersion);
            if (cached) {
                results.push(cached.filter((c: { name: string; }) => regex.test(c.name)));
            }
            else {
                const array = await vscode.workspace.fs.readFile(file);
                const str = Buffer.from(array).toString('utf8');
                const ast = getAst(str, token);
                const symbols = getSymbolsFromAst(ast, file);
                symbolCache.putSymbols(cacheKey, fileVersion, symbols);
                results.push(symbols.filter(c => regex.test(c.name)));
            }
        }
        const result = results.flat();
        return result;
    }

}
