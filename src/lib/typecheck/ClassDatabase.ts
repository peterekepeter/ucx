import { ClassNamingRule } from "../lint/ast-rules/ClassNamingRule";
import { ParserToken, SemanticClass, UnrealClass, isTokenAtOrBetween } from "../parser";
import { 
    UnrealClassConstant, 
    UnrealClassFunction, 
    UnrealClassFunctionArgument, 
    UnrealClassFunctionLocal, 
    UnrealClassState, 
    UnrealClassStruct, 
    UnrealClassVariable, 
    getStatementsRecursively, 
    getAllClassFunctions, 
    getExpressionTokensRecursively,
    UnrealClassEnum
} from "../parser/ast";
import { renderDefinitionMarkdownLines, renderFnDocumentationPrototypeToString, renderFnImplementationStubToString } from "./renderDefinitonMarkdownLines";

export type TokenInformation = {
    found?: boolean,
    missingAst?: boolean,
    token?: ParserToken,
    ast?: UnrealClass,
    uri?: string,
    functionScope?: UnrealClassFunction
    stateScope?: UnrealClassState,
    localDefinition?: UnrealClassFunctionLocal,
    paramDefinition?: UnrealClassFunctionArgument,
    varDefinition?: UnrealClassVariable,
    fnDefinition?: UnrealClassFunction,
    classDefinition?: UnrealClass
    constDefinition?: UnrealClassConstant,
    structDefinition?: UnrealClassStruct,
    overload?: TokenInformation,
    enumDefinition?: UnrealClassEnum,
};

export type CompletionInformation = {
    label: string,
    kind?: SemanticClass,
    retrigger?: boolean,
    text?: string,
    sortText?: string,
};

export type ClassFileEntry = {
    ast: UnrealClass; 
    url: string,
    version: number,
    source?: 'workspace'|'library',
};

export class ClassDatabase
{
    store: Record<string, ClassFileEntry> = {};

    findTokenBeforePosition(uri: string, line: number, character: number): TokenInformation {
        const ast = this.getAst(uri);
        if (!ast) return { uri, missingAst: true };
        let token = this.astFindTokenBeforePosition(ast, line, character);
        if (!token) return { uri, found: false };
        const stateScope = this.findStateScope(ast, token);
        // TODO optimization only look for function inside state
        const functionScope = this.findFunctionScope(ast, token);
        return { uri, found: true, token, ast, functionScope, stateScope };
    }

    findToken(uri: string, line: number, character: number): TokenInformation {
        const ast = this.getAst(uri);
        if (!ast) return { uri, missingAst: true };
        let token = this.astFindTokenAtPosition(ast, line, character);
        if (!token) return { uri, found: false };
        const stateScope = this.findStateScope(ast, token);
        // TODO optimization only look for function inside state
        const functionScope = this.findFunctionScope(ast, token);
        return { uri, found: true, token, ast, functionScope, stateScope };
    }

    /** 
     * same as find token, but prioritizes symbol token around the target,
     * so it returns symbol token even when the target is the space next to the token
     * */
    findSymbolToken(uri: string, line: number, character: number): TokenInformation {
        const ast = this.getAst(uri);
        if (!ast) return { uri, missingAst: true };
        let token = this.astFindSymbolTokenAtPosition(ast, line, character);
        if (!token) return { uri, found: false };
        const stateScope = this.findStateScope(ast, token);
        // TODO optimization only look for function inside state
        const functionScope = this.findFunctionScope(ast, token);
        return { uri, found: true, token, ast, functionScope, stateScope };
    }


    findCompletions(uri: string, line: number, character: number): CompletionInformation[] {
        const ast = this.getAst(uri);
        if (!ast) {
            return [];
        }
        if (!ast.name) {
            // class not declared
            const expectedName = new ClassNamingRule().getExpectedClassName(uri.toString());
            if (ast.classDeclarationFirstToken) {
                const firstToken = ast.classDeclarationFirstToken;
                if (firstToken.line === line) 
                {
                    let prepend = '';
                    if (firstToken.position + firstToken.text.length === character) 
                    {
                        prepend = ' ';
                    }
                    return [{
                        label: prepend + expectedName + ' extends ',
                        kind: SemanticClass.ClassDeclaration,
                        retrigger: true,
                    }];
                }

            } else {
                return [{
                    label: 'class ' + expectedName + ' extends ',
                    kind: SemanticClass.ClassDeclaration,
                    retrigger: true,
                }];
            }
        }
        let before = this.findTokenBeforePosition(uri, line, character);
        if (!before.token) {
            return [];
        }
        let regexp: RegExp|undefined;
        if (before.token.line === line 
            && before.token.position + before.token.text.length === character 
            && before.token.type !== SemanticClass.None) {
            if (before.token.type === SemanticClass.LiteralNumber) {
                return []; // do not continue numbers
            }
            // token continuation reuqest
            let text = before.token.text;
            if (text.startsWith("'")) text=text.substring(1);
            if (text) {
                regexp = new RegExp(before.token.text, 'i');
                before = this.findTokenBeforePosition(uri, before.token.line, before.token.position);
            }
        }
        if (!before.token) {
            return [];
        }
        if (before.token.type === SemanticClass.Keyword &&
            (before.token.textLower === 'extends' ||
            before.token.textLower === 'expands' ||
            before.token.textLower === 'var' ||
            before.token.textLower === 'local')
        ) {
            const list = this.findAllExtendableClassNames(regexp);
            const results: CompletionInformation[] = [];
            for (const item of list) {
                if (item) {
                    results.push({
                        label: item,
                        kind: SemanticClass.ClassReference,
                    });
                }
            }
            return results;
        }
        if (before.functionScope) {
            const next = before.ast?.tokens[before.token.index + 1];
            if (before.token.type === SemanticClass.ObjectReferenceName && before.token.text.startsWith("'")) {
                // is name completion        
                if (before.token.text.endsWith("'") && before.token.text.length > 2) {
                    return [];
                }
                const beforeBefore = before.ast?.tokens[before.token.index - 1];
                if (beforeBefore && beforeBefore.type === SemanticClass.ClassReference && beforeBefore.textLower === 'class') {
                    return this.findAllExtendableClassNames().map(c => ({
                        label: c,
                        kind: SemanticClass.ClassReference,
                    }));
                }
            }
            else if (before.token.type === SemanticClass.None && before.token.text === ".")
            {
                // member completion
                let index = before.token.index - 1;
                let beforeDot = ast.tokens[index];
                let count = 0;
                while (beforeDot && (beforeDot.text === ']' || count > 0)) {
                    const txt = ast.tokens[index].text;
                    if (txt === ']') count += 1;
                    else if (txt === '[') count -= 1;
                    index -= 1;
                    beforeDot = ast.tokens[index];
                }
                if (beforeDot) {
                    const token = this.findToken(uri, beforeDot.line, beforeDot.position);
                    const symboldef = this.findDefinition(token);
                    let typedef = this.findTypeOfDefinition(symboldef);
                    let results: CompletionInformation[][] = [];
                    let sortIndex = 0;
                    let sortText = '0';
                    while (typedef.structDefinition) {
                        results.push(typedef.structDefinition.members.map(m => ({
                            label: m.name?.text ?? '',
                            kind: SemanticClass.StructMember,
                        })));
                        const parentStructName = typedef.structDefinition.parentName;
                        if (!parentStructName) {
                            typedef = { found: false };
                            break;
                        }
                        typedef = this.findInheritedTypeSynmbol({ 
                            token: parentStructName,
                            ast: before.ast, 
                            structDefinition: before.structDefinition, 
                        });
                        sortIndex += 1;
                        sortText = getSortString(sortIndex);
                    }
                    while (typedef.ast) {
                        results.push(
                            typedef.ast.functions.filter(f => !f.isOperator).map(f => ({
                                label: f.name?.text ?? '',
                                sortText,
                                kind: SemanticClass.FunctionReference,
                            })),
                            typedef.ast.variables.map(v => ({
                                label: v.name?.text ?? '',
                                sortText,
                                kind: SemanticClass.VariableReference,
                            })),
                            typedef.ast.constants.map(v => ({
                                label: v.name?.text ?? '',
                                sortText,
                                kind: SemanticClass.ClassConstant,
                            })),
                        );
                        typedef = this.findClassDefinitionStr(typedef.classDefinition?.parentName?.textLower ?? '');
                        sortIndex += 1;
                        sortText = getSortString(sortIndex);
                    }
                    return results.flat();
                }
            }
            else if (before.token.type === SemanticClass.None && (before.token.text === ";" || before.token.text === '{' || before.token.text === '(' || before.token.text === ',') 
                || before.token.type === SemanticClass.Operator)
            {
                // expression completion
                if (ast) {
                    let sortIndex = 0;
                    let sortText = '0';
                    let results = [
                        ...before.functionScope.fnArgs.map(v => ({
                            label: v.name?.text ?? '',
                            sortText,
                            kind: SemanticClass.VariableReference,
                        })),
                        ...before.functionScope.locals.map(v => ({
                            label: v.name?.text ?? '',
                            sortText,
                            kind: SemanticClass.VariableReference,
                        })),
                    ];
                    let cls = ast;
                    while (cls) {
                        sortIndex += 1;
                        sortText = getSortString(sortIndex);
                        results = results.concat(
                            cls.functions.map(f => ({
                                label: f.name?.text ?? '',
                                sortText,
                                kind: SemanticClass.FunctionReference,
                            })),
                            cls.variables.map(v => ({
                                label: v.name?.text ?? '',
                                sortText,
                                kind: SemanticClass.VariableReference,
                            })),
                            cls.constants.map(v => ({
                                label: v.name?.text ?? '',
                                sortText,
                                kind: SemanticClass.ClassConstant,
                            })),
                        );
                        if (!cls.parentName) break;
                        const def = this.findClassDefinitionStr(cls.parentName.textLower);
                        if (!def.found || !def.classDefinition) break;
                        cls = def.classDefinition;
                    }
                    const enumCompletions = this.getAllEnumMembers().map(s => ({
                        label: s, kind: SemanticClass.EnumMember, sortText,
                    }));
                    results.push(...enumCompletions);
                    return results;
                }
            }
        }
        
        if (before.token.text === '}' || before.token.text === ';') {
            // start of a new top level declaration
            const results: CompletionInformation[] = [];
            for (const fn of this.findOverriableFunctions(ast)) {
                if (!fn.ast || !fn.fnDefinition) continue;
                if (ast.functions.find(f => f.name?.textLower === fn.fnDefinition?.name?.textLower)) continue;
                results.push({
                    // TODO handle states
                    label: renderFnDocumentationPrototypeToString(fn.ast, undefined, fn.fnDefinition),
                    text: renderFnImplementationStubToString(fn.fnDefinition),
                    kind: SemanticClass.FunctionDeclaration,
                });
            }
            return results;
        }
        return [];
    }

    getAllEnumMembers(): string[] {
        const results = [];
        for (const uri in this.store) {
            const entry = this.store[uri];
            const ast = entry.ast;
            for (const e of ast.enums){
                for (const m of e.enumeration) {
                    results.push(m.text);
                }
            }
        }
        return results;
    }

    findOverriableFunctions(ast: UnrealClass): TokenInformation[] {
        const results: TokenInformation[] = [];
        for (let parent = this.findParentClassOf(ast?.name?.textLower ?? ''); parent.found; parent = this.findParentClassOf(parent.ast?.name?.textLower ?? '')) 
        {
            if (!parent.ast) break;
            for (let fn of parent.ast?.functions) {
                if (fn.isFinal) continue;
                results.push({
                    ast: parent.ast,
                    fnDefinition: fn,
                });
            }
        }
        return results;
    }
    
    findReferences(uri: string, line: number, character: number): TokenInformation[] {
        const token = this.findSymbolToken(uri, line, character);
        const definition = this.findDefinition(token);
        const references: TokenInformation[] = [definition];

        if (!definition.token) {
            return references;
        }

        if (definition.token.type === SemanticClass.StatementLabel && definition.functionScope) {
            for (const st of getStatementsRecursively(definition.functionScope.body)) {
                if (st.op?.type === SemanticClass.Keyword && st.op.textLower === 'goto') {
                    const arg = st.args[0];
                    if (arg && 'text' in arg && definition.token.textLower === arg.textLower) {
                        references.push({
                            ast: definition.ast,
                            token: arg,
                            functionScope: definition.functionScope,
                            stateScope: definition.stateScope,
                            uri: definition.uri,
                        });
                    }
                }
            }
            return references;
        }
        
        if (definition.localDefinition || definition.paramDefinition) {
            const ast = definition.ast;
            const firstTokenIndex = definition.functionScope?.fnArgsFirstToken?.index;
            const lastTokenIndex = definition.functionScope?.bodyLastToken?.index;
            if (ast && firstTokenIndex != null && lastTokenIndex != null) {
                // reset, becase the token based algorithm will re-add the definition as well
                references.length = 0; 
                for (let i=firstTokenIndex; i<lastTokenIndex; i+=1){
                    const tok = ast.tokens[i];
                    if (tok.textLower === definition.token.textLower) {
                        const possibleReference = { 
                            ast, 
                            token: tok, 
                            functionScope: definition.functionScope, 
                            uri: definition.uri 
                        } as TokenInformation;
                        const targetDef = this.findLocalFileDefinition(possibleReference);
                        if (targetDef.token === definition.token) {
                            references.push(possibleReference);
                        }
                    }
                }
            }
        }

        if (definition.fnDefinition) {
            const fnDefinition = definition.fnDefinition;
            const lowerName = fnDefinition.name?.textLower;
            if (!lowerName) {
                return references;
            }
            for (const file in this.store) {
                const item  = this.store[file];
                for (const fn of getAllClassFunctions(item.ast)) {
                    // TODO add inherited versions
                    for (const statement of getStatementsRecursively(fn.body)) {
                        for (const tok of getExpressionTokensRecursively(statement)) {
                            if (tok.type === SemanticClass.FunctionReference && tok.textLower === lowerName) {
                                // TODO check if actually reference, not just coincidence
                                references.push({
                                    ast: item.ast,
                                    functionScope: fn,
                                    uri: item.url,
                                    found: true,
                                    token: tok,
                                });
                            }
                        }
                    }
                }

            }
        }

        if (definition.classDefinition) {
            const classDef = definition.classDefinition;
            const lowerClassName = classDef.name?.textLower;
            const lowerDecoratedName = `'${lowerClassName}'`;
            if (!lowerClassName) {
                return references;
            }
            for (const file in this.store) {
                const item = this.store[file];
                if (item.ast.parentName?.textLower === lowerClassName) {
                    // class extends referenced class
                    references.push({
                        ast: item.ast,
                        classDefinition: item.ast,
                        uri: item.url,
                        found: true,
                        token: item.ast.parentName,
                    });
                }
                for (const v of item.ast.variables) {
                    if (v.type?.textLower === lowerClassName) {
                        // class used as var type in var decl
                        references.push({
                            ast: item.ast,
                            varDefinition: v,
                            uri: item.url,
                            found: true,
                            token: v.type,
                        });
                    }
                }
                for (const fn of getAllClassFunctions(item.ast)) {
                    for (const param of fn.fnArgs) {
                        if (param.type?.textLower === lowerClassName) {
                            // class used as param type in fn decl
                            references.push({
                                ast: item.ast,
                                functionScope: fn,
                                paramDefinition: param,
                                uri: item.url,
                                found: true,
                                token: param.type,
                            });
                        }
                    }
                    for (const statement of getStatementsRecursively(fn.body)) {
                        for (const tok of getExpressionTokensRecursively(statement)) {
                            if (tok.type === SemanticClass.ObjectReferenceName && tok.textLower === lowerDecoratedName) {
                                // referenced by object name like class'MyClass'
                                references.push({
                                    ast: item.ast,
                                    functionScope: fn,
                                    uri: item.url,
                                    found: true,
                                    token: tok,
                                });
                            }
                            if (tok.type === SemanticClass.FunctionReference && tok.textLower === lowerClassName) {
                                // typecasts to class type MyClass(someobject)
                                // TODO check if actually reference, not just coincidence
                                references.push({
                                    ast: item.ast,
                                    functionScope: fn,
                                    uri: item.url,
                                    found: true,
                                    token: tok,
                                });
                            }
                        }
                    }
                }
                for (const defaultprop of item.ast.defaultProperties) {
                    const value = defaultprop.value;
                    if (!value) {
                        continue;
                    }
                    if ('op' in value) {
                        const expr = value;
                        for (const tok of getExpressionTokensRecursively(expr)) {
                            if (tok.type === SemanticClass.ObjectReferenceName && tok.textLower === lowerDecoratedName) {
                                // referenced by object name like class'MyClass'
                                references.push({
                                    ast: item.ast,
                                    uri: item.url,
                                    found: true,
                                    token: tok,
                                });
                            }
                        }
                    }
                }
            }
        }

        if (definition.structDefinition) {
            const structDef = definition.structDefinition;
            const nameLower = structDef.name?.textLower;
            if (!nameLower) {
                return references;
            }
            for (const file in this.store) {
                // TODO look only in descendants subtree instead of all classes
                const item  = this.store[file];
                for (const v of item.ast.variables) {
                    // TODO check if inherited symbol
                    if (v.type?.textLower === nameLower) {
                        references.push({
                            ast: item.ast,
                            varDefinition: v,
                            uri: item.url,
                            found: true,
                            token: v.type,
                        });
                    }
                }
                for (const fn of getAllClassFunctions(item.ast)) {
                    for (const l of fn.locals) {
                        // TODO check if inherited symbol
                        if (l.type?.textLower === nameLower) {
                            references.push({
                                ast: item.ast,
                                functionScope: fn,
                                localDefinition: l,
                                uri: item.url,
                                found: true,
                                token: l.type,
                            });
                        }
                    }
                }
            }
        }

        if (definition.varDefinition) {
            const varDef = definition.varDefinition;
            const nameLower = varDef.name?.textLower;
            if (!nameLower || !varDef) {
                return references;
            }
            const [subtypes, othertypes, lowersubtypenames] = this.findSubtreePartition(definition.ast);
            // references from same class
            for (const cls of subtypes) {
                for (const fn of getAllClassFunctions(cls.ast)) {
                    for (const statement of getStatementsRecursively(fn.body)) {
                        for (const tok of getExpressionTokensRecursively(statement)) {
                            if (tok.type === SemanticClass.VariableReference && tok.textLower === nameLower) {
                                references.push({
                                    uri: cls.url,
                                    ast: cls.ast,
                                    functionScope: fn,
                                    token: tok,
                                    found: true,
                                });
                            }
                        }
                    }
                }
                for (const prop of cls.ast.defaultProperties) {
                    if (prop.name?.textLower === nameLower) {
                        references.push({
                            uri: cls.url,
                            ast: cls.ast,
                            token: prop.name,
                            found: true,
                        });
                    }
                }
            }
            // member references from othertypes 
            for (const cls of othertypes) {
                for (const fn of getAllClassFunctions(cls.ast)) {
                    for (const statement of getStatementsRecursively(fn.body)) {
                        for (const tok of getExpressionTokensRecursively(statement)) {
                            if (tok.type === SemanticClass.VariableReference && tok.textLower === nameLower) {
                                const before = cls.ast.tokens[tok.index-1];
                                if (before && before.text === '.') {
                                    const beforeBefore = cls.ast.tokens[tok.index-2];
                                    if (beforeBefore) {
                                        const def = this.findDefinition({
                                            token: beforeBefore,
                                            functionScope: fn,
                                            uri: cls.url,
                                            ast: cls.ast,
                                        });
                                        const type = this.findTypeOfDefinition(def);
                                        if (lowersubtypenames.has(type.classDefinition?.name?.textLower ?? '')) {
                                            // is var member access from subtype of queried type
                                            references.push({
                                                uri: cls.url,
                                                ast: cls.ast,
                                                functionScope: fn,
                                                token: tok,
                                                found: true,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

        }

        return references;
    }

    private astFindTokenAtPosition(ast: UnrealClass, line: number, character: number) {
        let token: ParserToken | undefined;
        for (const t of ast.tokens) {
            if (t.line === line) {
                if (t.position <= character && character < t.position + t.text.length) {
                    token = t;
                    break;
                }
            }
        }
        return token;
    }

    /** 
     * makes symbols selectable on position right after the symbol text
     * */
    private astFindSymbolTokenAtPosition(ast: UnrealClass, line: number, character: number) {
        let token: ParserToken | undefined;
        for (const t of ast.tokens) {
            if (t.line === line) {
                let grow = 1;
                if (t.type === SemanticClass.None || t.type === SemanticClass.Operator) {
                    // reduce importance of operators and language symbols
                    // in favor of symbols
                    grow = 0;
                }
                if (t.position <= character && character < t.position + t.text.length + grow) {
                    token = t;
                    break;
                }
            }
        }
        return token;
    }


    private astFindTokenBeforePosition(ast: UnrealClass, line: number, position: number) {
        let token: ParserToken | undefined;
        for (const t of ast.tokens) {
            if (t.line < line || t.line === line && t.position < position) {
                token = t;
            }
            else {
                break;
            }
        }
        return token;
    }

    private findFunctionScope(ast: UnrealClass, token: ParserToken) {
        let functionScope: UnrealClassFunction | undefined;
        for (const fn of ast.functions) {
            const from = fn.name ?? fn.fnArgsFirstToken ?? fn.bodyFirstToken;
            const to = fn.bodyLastToken ?? fn.fnArgsLastToken ?? fn.name;
            if (from && to && isTokenAtOrBetween(token, from, to)) {
                functionScope = fn;
                break;
            }
        }
        return functionScope;
    }

    private findStateScope(ast: UnrealClass, token: ParserToken) {
        let stateScope: UnrealClassState | undefined;
        for (const s of ast.states) {
            const from = s.name ?? s.bodyFirstToken;
            const to = s.bodyLastToken;
            if (from && to && isTokenAtOrBetween(token, from, to)) {
                stateScope = s;
                break;
            };
        }
        return stateScope;
    }

    /** provides fast lookup if type is in same file without needing full library scan */
    findLocalFileDefinition(query: TokenInformation): TokenInformation {
        let result: TokenInformation|undefined;
        if (!query.token) return { found: false };
        if (!query.ast) return { missingAst: true };
        if (query.token.type === SemanticClass.StatementLabel && query.functionScope) {
            for (const st of getStatementsRecursively(query.functionScope.body)) {
                if (st.op?.text === ':' && st.args.length > 0) {
                    // this is a label
                    const arg = st.args[0];
                    if ('text' in arg && arg.textLower === query.token.textLower){
                        result = {
                            token: arg,
                            classDefinition: query.ast,
                            functionScope: query.functionScope,
                            stateScope: query.stateScope,
                        };
                        break;
                    }
                }
            }
        }
        if (query.token.type === SemanticClass.LanguageVariable) {
            if (query.token.textLower === 'self' && query.ast.name) {
                result = {
                    token: query.ast.name,
                    classDefinition: query.ast,
                };
            }
            else if (query.token.textLower === 'default' && query.ast.name) {
                const before = query.ast.tokens[query.token.index - 1];
                if (before && before.text !== ".") { 
                    // check if preceeded by dot, in which case it's the default of another class
                    result = {
                        token: query.ast.name,
                        classDefinition: query.ast,
                    };
                }
            }
        }
        if (!result && this.isTypeQuery(query)) {
            // struct may be in same file
            result = this.findClassScopedSymbol(query.token, query.ast);
            if (!result?.structDefinition) {
                // looking for a type in this file
                return { found: false }; // HACK assume types are always across files
            }
        }
        const before = query.ast.tokens[query.token.index - 1];
        if (before && before.text !== '.') {
            // only handle if not member expression
            if (!result && query.functionScope && query.token.type) {
                result = this.findFunctionScopedSymbol(query);
            }
            if (!result && query.stateScope) {
                result = this.findStateScopedSymbol(query);
            }
            if (!result) {
                result = this.findClassScopedSymbol(query.token, query.ast);
            }
        }
        else {
            // check if its a struct member
            // but if it fails here then the symbol is in another class
            // better let the smarter cross-file find handle this
            const tokens = query.ast.tokens;
            let index = tokens.indexOf(query.token);
            const chain = this.getMemberChain(tokens, index);
            let member: TokenInformation|undefined;
            if (chain.length >= 2) {
                member = this.findLocalFileDefinition({ ast: query.ast, token: chain[0] });
                for (let i=1; i<chain.length; i+=1){
                    // member of parent
                    let typename = member?.localDefinition?.type 
                        ?? member?.varDefinition?.type 
                        ?? member?.paramDefinition?.type;
                    
                    member = undefined; // this will be returned if it fails

                    if (!typename) break;


                    const tofind = chain[i].textLower;
                    const type = this.findLocalFileDefinition({ ast: query.ast, token: typename });
                    if (type.structDefinition) {
                        for (const m of type.structDefinition.members) {
                            if (m?.name?.textLower === tofind) {
                                member = { 
                                    ast: query.ast,
                                    token: m.name,
                                    varDefinition: m, 
                                    structDefinition: type.structDefinition,
                                    found: true,
                                };
                                break;
                            }
                        }
                    }
                }
            }
            if (member && member.found) {
                result = member;
            }
        }
        if (!result && query.token.textLower === query.ast.name?.textLower) {
            result = {
                token: query.ast.name,
                classDefinition: query.ast,
            };
        }
        // post processing the result to fill members
        if (result?.token) {
            result.found = true;
            result.ast = query.ast;
            result.uri = query.uri;
            if (result?.fnDefinition?.isOperator) {
                this.findOperatorOverloads(result, result.ast, result.uri ?? '');
            }
            return result;
        }
        return { found: false };
    }

    findCrossFileDefinition(query: TokenInformation): TokenInformation {
        if (query.token && query.ast) {
            if (query.token.type === SemanticClass.LanguageVariable) {
                if (query.token.textLower === 'super' && query.ast.parentName) {
                    return this.findClassDefinitionStr(query.ast.parentName.textLower);
                }
            }
            if (this.isTypeQuery(query)) {
                // looking for parent definition
                const result = this.findInheritedTypeSynmbol(query);
                if (result.found) return result;
                return this.findClassDefinitionForQueryToken(query);
            }
            if (this.isMemberQuery(query)) {
                return this.findMemberDefinitionForQueryToken(query);
            }
            // look for symbol in parent class
            const inheritedSymbol = this.findInheritedSybol(query);
            if (inheritedSymbol?.found) {
                // if (inheritedSymbol.fnDefinition?.isOperator) {
                //     this.findInheritedOperatorOverloads(inheritedSymbol);
                // }
                return inheritedSymbol;
            }
            // maybe its a typecast to another class
            const classdef = this.findClassDefinitionForQueryToken(query);
            if (classdef.found) {
                return classdef;
            }
            // maybe its an enum
            const enumMember = this.findEnumMemberDefinitionForQueryToken(query)
            if (enumMember?.found) {
                return enumMember;
            }
        }
        return { found: false };
    }
    
    private findEnumMemberDefinitionForQueryToken(query: TokenInformation): TokenInformation|undefined {
        const nameLower = query.token?.textLower;
        if (!nameLower) return undefined;
        // TODO match package
        for (const uri in this.store) {
            const entry = this.store[uri];
            const ast = entry.ast;
            const result = this.findEnumMemberDefinitionInClass(nameLower, uri, ast);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

    findEnumMemberDefinitionInClass(nameLower: string | undefined, uri: string, ast: UnrealClass): TokenInformation|undefined {
        for (const e of ast.enums) {
            for (const em of e.enumeration) {
                if (em.textLower == nameLower)
                return {
                    uri: uri,
                    token: em ?? undefined,
                    ast: ast,
                    enumDefinition: e,
                    found: true,
                }
            }
        }
        return undefined;
    }

    // goes up the inheritance tree to look for struct type matches
    findInheritedTypeSynmbol(query: TokenInformation): TokenInformation {
        const nameLower = query.token?.textLower;
        let uri = query.uri;
        let ast = query.ast;
        for (let i=0; i<1000; i+=1) { // limit inheritance search depth to 1000
            if (!ast) break;
            if (ast?.structs) {
                for (const struct of ast?.structs) {
                    if (struct.name?.textLower === nameLower) {
                        return {
                            uri, ast,
                            token: struct.name ?? undefined,
                            structDefinition: struct,
                            found: true,
                        };
                    }
                }
            }
            if (ast?.enums) {
                for (const e of ast?.enums) {
                    if (e.name?.textLower === nameLower) {
                        return {
                            uri, ast, token: e.name ?? undefined, enumDefinition: e, found: true,
                        }
                    }
                }
            }
            if (ast.name) {
                const parent = this.findParentClassOf(ast.name.textLower);
                uri = parent.uri;
                ast = parent.ast;
            }
        }
        return { found:false };
    }

    private findInheritedOperatorOverloads(localResult: TokenInformation) {
        let item = localResult;
        while (true) {
            const name = item.ast?.name?.textLower;
            if (!name) return;
            item = this.findParentClassOf(name);
            if (!item.found || !item.ast || !item.uri) return;
            this.findOperatorOverloads(localResult, item.ast, item.uri);
        }
    }
    
    private findOperatorOverloads(result: TokenInformation, ast: UnrealClass, uri: string) {
        let tail = result;
        while (tail.overload) {
            tail = tail.overload;
        }
        for (const fn of ast.functions) {
            if (result.fnDefinition?.name?.textLower === fn.name?.textLower && result.fnDefinition !== fn) {
                tail = tail.overload = {
                    ast,
                    uri,
                    found: true,
                    fnDefinition: fn,
                };
            }
        }
    }

    private findInheritedSybol(query: TokenInformation) {
        let location: TokenInformation | undefined = query;
        let symbolName = query.token?.textLower;
        if (!symbolName || !query.token) return;
        while (location?.ast?.parentName) {
            location = this.findClassDefinitionStr(location.ast.parentName.textLower);
            if (!location.found || !location.ast) break;
            const symbol = this.findClassScopedSymbol(query.token, location.ast);
            if (symbol?.token) {
                symbol.found = true;
                symbol.uri = location.uri;
                symbol. ast = location.ast;
                return symbol;
            }
        }
    }

    findAllExtendableClassNames(regexp?: RegExp) {
        const results: { [key:string]: string } = {};
        for (const name in this.store) {
            const ast = this.store[name].ast;
            if (ast.parentName && !results[ast.parentName.textLower]) {
                if (!regexp || regexp.test(ast.parentName.text))
                    results[ast.parentName.textLower] = ast.parentName.text;
            }
            if (ast.name) {
                if (!regexp || regexp.test(ast.name.text))
                    results[ast.name.textLower] = ast.name.text;
            }
        }
        return Object.values(results);
    }

    updateAst(uri: string, ast: UnrealClass, version: number, source?: 'library'|'workspace') {
        if (!this.store[uri]) 
        {
            this.store[uri] = { 
                ast,
                version, 
                url: uri,
                source,
            };
        }
        else {
            const entry = this.store[uri];
            if (entry.version >= version) return;
            entry.ast = ast;
            entry.version = version;
            if (source) {
                entry.source = source;
            }
        }
    }

    getVersion(uri: string): number {
        return this.store[uri]?.version ?? -Infinity;
    }

    getAst(uri: string): UnrealClass|undefined {
        return this.store[uri]?.ast;
    }

    tagSourceAndGetVersion(uri: string, source: 'workspace'|'library'): number {
        const item = this.store[uri];
        if (item) {
            item.source = source;
            return item.version;
        }
        return -Infinity;
    }

    *getAllFileEntries(options?: { includeWorkspace?: boolean, includeLibrary?: boolean}): Iterable<ClassFileEntry> {
        for (const key in this.store) {
            const item = this.store[key];
            if (item.source === 'library' && options?.includeLibrary ||
               item.source === 'workspace' && options?.includeWorkspace) {
                yield item;
            }
        }
    }

    findChildClassesOf(className: string): TokenInformation[] {
        const results: TokenInformation[] = [];
        const lowerClassName = className.toLowerCase();
        for (const key in this.store) {
            const item = this.store[key];
            if (item.ast.parentName?.textLower === lowerClassName && item.ast.name) {
                results.push({
                    found: true,
                    token: item.ast.name,
                    uri: key,
                    ast: item.ast,
                    classDefinition: item.ast
                });
            }
        }
        results.sort((a,b) => (a.token?.textLower && b.token?.textLower) 
            ? a.token.textLower.localeCompare(b.token.textLower) : 0);
        return results;
    }

    findParentClassOf(childClassName: string): TokenInformation {
        const lowerClassName = childClassName.toLowerCase();
        const definition = this.findClassDefinitionStr(lowerClassName);
        if (!definition.found || !definition.classDefinition?.parentName) {
            return { found: false };
        }
        const parentLowerName = definition.classDefinition.parentName.textLower;
        for (const key in this.store) {
            const item = this.store[key];
            if (item.ast.name?.textLower === parentLowerName && item.ast.name) {
                return {
                    found: true,
                    token: item.ast.name,
                    uri: key,
                    ast: item.ast,
                    classDefinition: item.ast
                };
            }
        }
        return { found: false };
    }

    findSignature(uri: string, line: number, column: number): TokenInformation {
        const cursor = this.findTokenBeforePosition(uri, line, column);
        if (!cursor.found || !cursor.functionScope || !cursor.token || !cursor.ast) return { found: false };
        const ast = cursor.ast;
        let commas = 0;
        let parens = 0;
        let method: ParserToken | null = null;
        for (let i = cursor.token.index; i >= 0; i-=1) {
            const t = ast.tokens[i];
            if (parens < 0) {
                method = t;
                break;
            }

            if (t.text === ',' && parens === 0) {
                commas += 1;
            }
            else if (t.text === ')') {
                parens += 1;
            }
            else if (t.text === '(') {
                parens -= 1;
            }
            else if (t.text === '{') {
                break;
            }
        }
        if (!method) return { found: false };
        const methodDef = this.findDefinition({
            uri: cursor.uri,
            ast: ast,
            token: method,
        });
        if (!methodDef.fnDefinition) return { found: false };
        return {
            ...methodDef, 
            paramDefinition: methodDef.fnDefinition.fnArgs[commas],
        };
    }

    private isMemberQuery(query: TokenInformation) {
        if (!query.token || !query.ast) return false;
        const index = query.ast.tokens.indexOf(query.token);
        return this.isMemberToken(query.ast.tokens, index);
    }

    private isMemberToken(tokens: ParserToken[], index: number) {
        if (index > 0) {
            const before = tokens[index-1];
            if (before.text === ".") {
                return true;
            }
        }
    }

    private findMemberDefinitionForQueryToken(query: TokenInformation): TokenInformation {
        if (!query.token || !query.ast) return { found: false };
        const tokens = query.ast.tokens;
        let index = tokens.indexOf(query.token);
        const chain = this.getMemberChain(tokens, index);
        let type: TokenInformation|null = null;
        let member: TokenInformation|null = null;
        for (const item of chain) {
            if (item.text === ')') 
            {
                // is using result of function call or typecast
                // find matching paren
                const toks = query.ast.tokens;
                let count = 1;
                let found = false;
                for (let i = 1; i<item.index; i+=1) {
                    const prev = toks[item.index-i];
                    if (prev.text === ')') count += 1;
                    if (prev.text === '(') {
                        count -= 1;
                        if (count === 0) {
                            const fn = toks[item.index - i - 1];
                            const subquery = { ...query, token: fn };
                            member = this.findDefinition(subquery);
                            if (!member.found) {
                                member = this.findClassDefinitionStr(fn.textLower);
                            }
                            found = true;
                            break;
                        }
                    }
                }
                if (found) {
                    continue;
                }
            }
            if (item.textLower === 'static' || item.textLower === 'default') {
                if (!type) {
                    // standalone keyword references current type
                    type = {
                        found: true,
                        ast: query.ast,
                        classDefinition: query.ast,
                        uri: query.uri,
                    };
                }
                continue;
            }
            const itemQuery: TokenInformation = {
                token: item,
                ast: query.ast,
                functionScope: query.functionScope,
                uri: query.uri, 
            };
            if (member){
                // look inside class of member
                if (member.classDefinition) {
                    // member already a class
                    type = member; // redundant branch
                }
                else {
                    type = this.findTypeOfDefinition(member);
                }
                member = null;
            }
            if (type) {
                member = this.findMemberDefinition(type, itemQuery);
            } else {
                member = this.findDefinition(itemQuery);
            }
        }
        if (member) {
            return member;
        }
        return { found: false };
    }

    findDefinition(itemQuery: TokenInformation): TokenInformation {
        let result = this.findLocalFileDefinition(itemQuery);
        if (!result.found) {
            result = this.findCrossFileDefinition(itemQuery);
        }
        if (result.fnDefinition?.isOperator) {
            this.findInheritedOperatorOverloads(result);
        }
        return result;
    }

    private findMemberDefinition(typeDefinition: TokenInformation, memberReference: TokenInformation): TokenInformation {
        if (!typeDefinition.ast) return { found: false };
        const tofind = memberReference.token?.textLower;
        if (typeDefinition.structDefinition) {
            // handle struct type
            for (const member of typeDefinition.structDefinition.members) {
                if (member.name?.textLower === tofind) {
                    return {
                        token: member.name ?? undefined,
                        ast: typeDefinition.ast,
                        uri: typeDefinition.uri,
                        structDefinition: typeDefinition.structDefinition,
                        varDefinition: member,
                        found: true,
                    };
                }
            }
        }
        for (const c of typeDefinition.ast.constants) {
            if (c.name && c.name?.textLower === tofind)
            {
                return {
                    token: c.name,
                    ast: typeDefinition.ast,
                    uri: typeDefinition.uri,
                    constDefinition: c,
                    found: true,
                };
            }
        }
        for (const fn of typeDefinition.ast.functions) {
            if (fn.name && fn.name?.textLower === tofind) {
                return {
                    token: fn.name,
                    ast: typeDefinition.ast,
                    uri: typeDefinition.uri,
                    fnDefinition: fn,
                    found: true,
                };
            }
        }
        for (const v of typeDefinition.ast.variables) {
            if (v.name && v.name.textLower === tofind) {
                return {
                    token: v.name,
                    ast: typeDefinition.ast,
                    uri: typeDefinition.uri,
                    varDefinition: v,
                    found: true,
                };
            }
        }
        return { found: false };
    }

    /**
     * @returns returns list of subtypes and non subtypes
     * */
    private findSubtreePartition(superClass?: UnrealClass): [ClassFileEntry[], ClassFileEntry[], Set<string>] {
        var classnames = new Set<string>();
        var list = Object.values(this.store);
        var len = list.length;
        var i, index = 0, tmp;
        for (i=0; i<len; i+=1) {
            if (list[i].ast === superClass) {
                classnames.add(list[i].ast.name?.textLower ?? '');
                tmp = list[index];
                list[index] = list[i];
                list[i] = tmp;
                index += 1;
                break;
            }
        }
        if (index === 0) {
            // not found? bug?
            [[], list]; // all entries are not subclases of ast
        }
        var keepPartitioning = true;
        while (keepPartitioning) {
            keepPartitioning = false;
            for (i = index; i < len; i += 1) {
                var parentLowerName = list[i].ast.parentName?.textLower ?? '';
                if (classnames.has(parentLowerName))
                {
                    var lowerName = list[i].ast.name?.textLower ?? '';
                    classnames.add(lowerName);
                    tmp = list[index];
                    list[index] = list[i];
                    list[i] = tmp;
                    index += 1;
                    keepPartitioning = true;
                }
            }
        }
        return [list.slice(0, index), list.slice(index), classnames];
    }

    findTypeOfDefinition(d: TokenInformation): TokenInformation {
        if (d.classDefinition) {
            return d;
        }
        if (d.fnDefinition) {
            return this.findDefinition({
                token: d.fnDefinition.name ?? undefined,
                ast: d.ast,
                uri: d.uri,
            });
        }
        if (d.paramDefinition) {
            return this.findDefinition({
                token: d.paramDefinition.type ?? undefined,
                ast: d.ast,
                uri: d.uri,
                functionScope: d.functionScope,
            });
        }
        if (d.localDefinition) {
            return this.findDefinition({
                token: d.localDefinition.type ?? undefined,
                ast: d.ast,
                uri: d.uri,
                functionScope: d.functionScope,
            });
        }
        if (d.varDefinition && d.varDefinition.type) {
            const lookfor = d.varDefinition.template ?? d.varDefinition.type;
            return this.findDefinition({
                token: lookfor,
                ast: d.ast, 
                uri: d.uri, 
            });
        }
        return { found: false };
    }

    private getMemberChain(tokens: ParserToken[], index: number) 
    {
        const stack = [tokens[index]];
        while (index > 1) {
            if (tokens[index-1].text === ".") {
                if (index > 2 && tokens[index-2].text === "]") {
                    // find opening bracket
                    let found = false;
                    for (let i=index-3; i>0; i-=1) {
                        if (tokens[i].text === "[") {
                            // found
                            index = i-1;
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        stack.push(tokens[index]);
                        continue;
                    }
                    else {
                        break;
                    }
                }
                else {
                    stack.push(tokens[index - 2]);
                    index -= 2;
                }
            }
            else {
                break;
            }
        }
        const chain = stack.reverse();
        return chain;
    }

    private findFunctionScopedSymbol(q: TokenInformation) {
        let result: TokenInformation|undefined;
        if (!q.functionScope || !q.token) return;
        result = this.findFunctionScopedSymbolStr(q.token.textLower, q.functionScope);
        if (result?.token) {
            result.found = true;
            result.functionScope = q.functionScope;
        }
        return result;
    }

    private findFunctionScopedSymbolStr(nameLower: string, fn: UnrealClassFunction){
        for (const param of fn.fnArgs) 
            if (param.name?.textLower === nameLower) 
                return { token: param.name, paramDefinition: param };
        for (const local of fn.locals) 
            if (local.name?.textLower === nameLower)
                return { token: local.name, localDefinition: local, };
    }

    private findStateScopedSymbol(q: TokenInformation) {
        let result: TokenInformation|undefined;
        if (!q.stateScope || !q.token) {
            return result;
        }
        result = this.findStateScopedSymbolStr(q.token.textLower, q.stateScope);
        if (result?.token) {
            result.found = true;
            result.stateScope = q.stateScope;
        }
        return result;
    }

    private findStateScopedSymbolStr(nameLower: string, state: UnrealClassState) {
        for (const fn of state.functions) {
            if (fn.name?.textLower === nameLower) {
                return { token: fn.name, fnDefinition: fn };
            }
        }
    }

    private findClassScopedSymbol(tok: ParserToken, ast: UnrealClass): TokenInformation|undefined {
        if (tok.type === SemanticClass.ClassReference) {
            if (ast.name?.textLower === tok.textLower) {
                return { token: ast.name, classDefinition: ast };
            }
            else {
                return;
            }
        }
        const name = tok.textLower;
        for (const variable of ast.variables) 
            if (variable.name?.textLower === name) 
                return { token: variable.name, varDefinition: variable };
        for (const fn of ast.functions)
            if (fn.name?.textLower === name)
                return { token: fn.name, fnDefinition: fn };
        for (const c of ast.constants) {
            if (c.name?.textLower === name) 
                return { token: c.name, constDefinition: c };
        }
        for (const s of ast.structs) {
            if (s.name?.textLower === name) 
                return { token: s.name, structDefinition: s };
            for (const member of s.members) {
                if (member.name?.textLower === name) {
                    return { token: member.name, structDefinition: s, varDefinition: member };
                }
            }
        }
    }

    private findClassDefinitionForQueryToken(q: TokenInformation) {
        if (!q.token) return { found: false };
        if (q.token.textLower.startsWith("'")) {
            const quoted = q.token.textLower;
            const className = quoted.substring(1, quoted.length - 1);
            return this.findClassDefinitionStr(className);
        }
        else {
            return this.findClassDefinitionStr(q.token.textLower);
        }
    }

    private findClassDefinitionStr(classNameLower: string): TokenInformation  {
        let packageNameLower = '';
        if (classNameLower.indexOf('.')) {
            const parts = classNameLower.split('.');
            classNameLower = parts[parts.length - 1];
            packageNameLower = parts[0];
        }
        // TODO match package
        for (const uri in this.store) {
            const entry = this.store[uri];
            const ast = entry.ast;
            if (ast.name?.textLower === classNameLower) {
                return { found: true, uri, ast, classDefinition: ast, token: ast.name };
            }
        }
        return { found: false };
    }

    private isTypeQuery(q: TokenInformation): boolean {
        if (!q.token || !q.ast) return false;
        if (q.token.type === SemanticClass.ClassReference) {
            return true;
        }
        if (q.token.type === SemanticClass.StructDeclaration) {
            return true;
        }
        if (q.functionScope)
        {
            const fn = q.functionScope;
            if (q.token.textLower.startsWith("'")) {
                const idx = q.ast.tokens.indexOf(q.token);
                if (idx > 0) {
                    const before = q.ast.tokens[idx - 1];
                    if (before.textLower === 'class') {
                        return true;
                    }
                }
            }
            for (const arg of fn.fnArgs) {
                if (q.token === arg.type) {
                    return true;
                }
            }
            for (const local of fn.locals) {
                if (q.token === local.type) {
                    return true;
                }
            } 
        }
        else if (q.token === q.ast.parentName) {
            return true; // look for parent class
        }
        else {
            for (const v of q.ast.variables) {
                if (q.token === v.type) {
                    return true; // look for type of var def
                }
            }
            for (const fn of getAllClassFunctions(q.ast)) {
                if (q.token === fn.returnType) {
                    return true;
                }
            }
        }
        return false;
    }
}

export function getSortString(i: number): string {
    if (i<10) return i.toString(); // 0..9
    if (i<20) return String.fromCodePoint(87+i) // a..j
    let r=[];
    while (i > 0) {
        r.push(String.fromCodePoint(107+(i&15)));
        i=i>>4;
    }
    r.reverse();
    return r.join('');
}