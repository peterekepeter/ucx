import { ParserToken, UnrealClass, isTokenAtOrBetween } from "../parser";
import { UnrealClassFunction, UnrealClassFunctionArgument, UnrealClassFunctionLocal } from "../parser/ast";

export type TokenInformation = {
    found?: boolean,
    missingAst?: boolean,
    token?: ParserToken,
    ast?: UnrealClass,
    uri?: string,
    functionScope?: UnrealClassFunction
    typeToken?: ParserToken | null,
    localDefinition?: UnrealClassFunctionLocal,
    paramDefinition?: UnrealClassFunctionArgument,
};

export class ClassDatabase
{
    findToken(uri: string, line: number, character: number): TokenInformation {
        const entry = this.store[uri];
        if (!entry) return { uri, missingAst: true };
        const ast = entry.ast;
        let token: ParserToken | undefined;
        for (const t of ast.tokens) {
            if (t.line === line) {
                if (t.position <= character && character < t.position + t.text.length) {
                    token = t;
                    break;
                }
            }
        }
        if (!token) return { uri, found: false };
        let functionScope: UnrealClassFunction | undefined;
        for (const fn of ast.functions) {
            const from = fn.name ?? fn.fnArgsFirstToken ?? fn.bodyFirstToken;
            const to = fn.bodyLastToken ?? fn.fnArgsLastToken ?? fn.name;
            if (from && to && isTokenAtOrBetween(token, from, to)) {
                functionScope = fn;
                break;
            }
        }
        return { uri, found: true, token, ast, functionScope };
    }

    findLocalFileDefinition(query: TokenInformation): TokenInformation {
        let result: TokenInformation = {} ;
        if (!query.token) return { found: false };
        if (!query.ast) return { missingAst: true };
        if (query.functionScope) {
            for (const param of query.functionScope.fnArgs) {
                if (param.name?.textLower === query.token.textLower) {
                    return {
                        found: true, 
                        ast: query.ast, 
                        functionScope: query.functionScope,
                        token: param.name,
                        typeToken: param.type,
                        paramDefinition: param,
                        uri: query.uri
                    };
                }
            }
            for (const local of query.functionScope.locals) {
                if (local.name?.textLower === query.token.textLower)
                {
                    return {
                        found: true,
                        ast: query.ast,
                        functionScope: query.functionScope,
                        token: local.name,
                        typeToken: local.type,
                        localDefinition: local,
                        uri: query.uri,
                    };
                }
            }
        }
        return result;
    }
    
    findCrossFileDefinition(query: TokenInformation): TokenInformation {
        return { found: false };
    }

    updateAst(uri: string, ast: UnrealClass, version: number) {
        if (!this.store[uri]) 
        {
            this.store[uri] = { ast, version };
        }
        else {
            const entry = this.store[uri];
            if (entry.version >= version) return;
            entry.ast = ast;
            entry.version = version;
        }
    }

    getVersion(uri: string): number {
        return this.store[uri]?.version ?? -Infinity;
    }

    store: Record<string, {
        ast: UnrealClass; 
        version: number
    }> = {};
}