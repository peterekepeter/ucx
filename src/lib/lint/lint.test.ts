import { ALL_AST_RULES } from "./ast-rules";
import { LintResult } from "./LintResult";
import { UcParser, ucTokenizeLine } from "..";
import { ALL_V2_TOKEN_RULES } from "./token-rules";

test('linting indent class declaration', () => {
    linting([
        'class Test',
        'extends Object;'
    ]).hasResult({
        line: 1,
        position: 0,
        originalText: '',
        fixedText: '\t'
    });
});

test('linting indent var declaration', () => {
    linting([
        'var config string',
        'Description',
        ';'
    ]).hasResult({
        line: 1,
        position: 0,
        originalText: '',
        fixedText: '\t'
    });
});

test('linting indent function body', () => {
    linting([
        'function Init() {',
        'Count = 0;',
        '}'
    ]).hasResult({
        line: 1,
        position: 0,
        originalText: '',
        fixedText: '\t'
    });
});

test('linting indent codeblock in function', () => {
    linting([
        'function Init() {',
        'if (bFirstRun)',
        '{',
        'Count = 0;',
        '}',
        '}'
    ]).hasResult({
        line: 2,
        fixedText: '\t'
    }).hasResult({
        line: 3,
        fixedText: '\t\t'
    }).hasResult({
        line: 4,
        fixedText: '\t'
    });
});

test('linting indent if inside if', () => {
    linting([
        'function Init() {',
        'if (bVerify) {',
        'if (bEnabled) {',
        'Count = 0;', // should have 3 indent
        '}',
        '}',
        '}'
    ]).hasResult({ line: 1, fixedText: '\t'
    }).hasResult({ line: 2, fixedText: '\t\t'
    }).hasResult({ line: 3, fixedText: '\t\t\t'
    });
});

test.skip('multiline argument indentation', () => {
    linting([
        'function Init()',
        '{',
        '    if (bEnabled && ',
        '    bAnotherEnabled) ', // should have 2 indent
        '    {',
        '    }',
        '}'
    ]).hasResult({ line: 3, originalText:'    ', fixedText: '\t\t'});
});

test('closing parenthesis is not indented', () => {
    linting([
        'function Init() {',
        '\tif (bEnabled',
        ')', // should have 1 indent, not 2
        '\t{', 
        '\t}',
        '}'
    ]).hasResult({ line: 2, fixedText: '\t'});
});

test('expression closing paranthesis is not indented', () => {
    linting([
        'function Init() {',
        '    x = (',
        '        3 + 4',
        '    );',
        '}'
    ]).hasResult({ line: 1, fixedText: '\t' 
    }).hasResult({ line: 2, fixedText: '\t\t' 
    }).hasResult({ line: 3, fixedText: '\t' });
});

test('lint indent only increases once when multiple scopes combine on same line', () => {
    linting([
        'function Init() {',
        '    if (c<10) { if (c>5) {',
        '        Log("test");',
        '    }}',
        '}'
    ]).hasResult({ line: 1, fixedText: '\t' 
    }).hasResult({ line: 2, fixedText: '\t\t' 
    }).hasResult({ line: 3, fixedText: '\t' });
});

test('lint indent single statement if without braces', () => {
    linting([
        'function Init() {',
        '    if (bFirstRun)',
        '        SaveConfig();',
        '}'
    ]).hasResult({ line: 1, fixedText: '\t' 
    }).hasResult({ line: 2, fixedText: '\t\t' 
    });
});

test('lint indent single statment if on one line', () => {
    linting([
        'function Init(object M)',
        '{',
        '   if (M == self) return;',
        '   Count = 0;',
        '}'
    ]).hasResult({ line: 2, fixedText: '\t' 
    }).hasResult({ line: 3, fixedText: '\t' 
    });
});

test('lint indent if with function call in condition', () => {
    linting([
        'function Init(){',
        '    if (CheckSomething()){',
        '        SaveConfig();',
        '    }',
        '}',
    ]).hasResult({ line: 1, fixedText: '\t' 
    }).hasResult({ line: 2, fixedText: '\t\t' 
    }).hasResult({ line: 3, fixedText: '\t' 
    });
});

test("lint keyword casing", () => {
    linting([
        'Class Test ExPands Actor;',
        'Const MAX = 5;'
    ]).hasResult({ line:0, originalText: 'Class', fixedText: 'class' 
    }).hasResult({ line:0, position: 11, originalText: 'ExPands', fixedText: 'expands' 
    }).hasResult({ line:1, originalText: 'Const', fixedText: 'const' 
    });
});

test("lint indent enum", () => {
    linting([
        'enum TestEnum {',
        '   TE_Stuff',
        '   TE_MoreStuff',
        '}'
    ]).hasResult({ line: 1, fixedText:'\t' 
    }).hasResult({ line: 2, fixedText:'\t' 
    });
});

test("lint indent enum with bracket newline", () => {
    linting([
        'enum TestEnum',
        ' {',
        '   TE_MoreStuff',
        ' }'
    ]).hasResult({ line: 1, fixedText:'' 
    }).hasResult({ line: 2, fixedText:'\t' 
    });
});

test("lint indent default properties", () => {
    linting([
        'defaultproperties {',
        'Description="Your description here!"',
        'DamageModifier=1.0',
        '}',
    ]).hasResult({ line: 1, fixedText:'\t' 
    }).hasResult({ line: 2, fixedText:'\t' 
    });
    
});

test("lint indent ignores commented lines", () => {
    linting([
        '/*enum TestEnum {',
        '   TE_Stuff',
        '   TE_MoreStuff',
        '}*/'
    ]).hasNoLintResults();
});

test("lint indent ignores empty lines", () => {
    linting([
        'function Test()',
        '{',
        '',
        '}'
    ]).hasNoLintResults();
});

test("function argument on new line indent", () => { linting([
    'function Max(',
    'int a,',
    'int b',
    ') {',
    '',
    '}'])
    .hasResult({ line:1, fixedText:'\t' })
    .hasResult({ line:2, fixedText:'\t' });
});

test('indent foreach statement block body', () => { linting([
    /*0*/'function Timer(){',
    /*1*/'local Projectile A;',
    /*2*/'foreach AllActors( class \'Projectile\', A )',
    /*3*/'{',
    /*4*/'Log(A);',
    /*5*/'}',
    /*6*/'}'])
    .hasResult({ line:1, fixedText:'\t' })
    .hasResult({ line:2, fixedText:'\t' })
    .hasResult({ line:3, fixedText:'\t' })
    .hasResult({ line:4, fixedText:'\t\t' })
    .hasResult({ line:5, fixedText:'\t' });
});

test('lint empty line before function', () => {
    linting([
        'function A()',
        '{',
        '}',
        'function B()',
        '{',
        '}',
    ]).hasResult({ line: 2, position:1, fixedText: '\n' 
    });
});

test('lint empty line before function', () => {
    linting([
        'function A()',
        '{',
        '}',
        '',
        'function B()',
        '{',
        '}',
    ]).hasNoLintResults();
});

test('lint empty line before function not required if function on single line', () => {
    linting([
        'function A();',
        'function B();',
    ]).hasNoLintResults();
});

const FUNCTION_LINES = [ 'function F()', '{', '}' ];

test('lint when commnet is before function empty line is not required', () => {
    linting([
        '// hello!',
        ...FUNCTION_LINES
    ]).hasNoLintResults();
});

test('lint when comment with space is before function empty line is not required', () => {
    linting([
        '  // hello!',
        ...FUNCTION_LINES
    ]).hasNoLintResults();
});

test('lint multiline comment with space is before function empty line is not required', () => {
    linting([
        '/*',
        ' hello! */',
        ...FUNCTION_LINES
    ]).hasNoLintResults();
});

test('lint operator not enough space before operator', () => { lintingStatements(
    'count= 0;'
).hasResult({ position: 5, originalText:'', fixedText:' ' });});

test('lint operator too much space before operator', () => { lintingStatements(
    'count   = 0;'
).hasResult({ position: 5, originalText:'   ', fixedText:' ' });});

test('lint operator not enough space after operator', () => { lintingStatements(
    'count =0;'
).hasResult({ position: 7, originalText:'', fixedText:' ' });});

test('lint operator too much space after operator', () => { lintingStatements(
    'count =   0;'
).hasResult({ position: 7, originalText:'   ', fixedText:' ' });});

test('lint operator space just right', () => { lintingStatements(
    'count = 0;'
).hasNoLintResults();});

test('lint operator negation should not have space', () => { lintingStatements(
    'x = - 1;'
).hasResult({ position: 5, fixedText:'', originalText:' '});});

test('lint None formatting correction', () => { lintingStatements(
    'x = none;'
).hasResult({ position: 4, fixedText:'None', originalText:'none'});});

test('lint None is correctly formatted', () => { lintingStatements(
    'x = None;'
).hasNoLintResults();});

test('lint True/False is correctly formatted', () => { lintingStatements(
    'x = True;',
    'x = False;'
).hasNoLintResults();});

test('lint True/False formatting correction', () => { lintingStatements(
    'x = true;',
    'x = false;'
)
    .hasResult({ position: 4, fixedText:'True', originalText:'true'})
    .hasResult({ position: 4, fixedText:'False', originalText:'false'});
});

test('lint newline before {', () => { lintingStatements(
    'if (bFirst) {',
    '}'
).hasResult({ line: 0, position:12, fixedText:'\n\t' });});

test('lint newline after {', () => { lintingStatements(
    'if (bFirst)',
    '{x = True;',
    '}'
).hasResult({ line: 1, position:1, fixedText:'\n\t\t' });});

test('lint newline before }', () => { lintingStatements(
    'if (bFirst)',
    '{',
    '\tx = False;}'
).hasResult({ line: 2, position:11, fixedText:'\n\t' });});

test('lint newline after }', () => { lintingStatements(
    'if (bFirst)',
    '{',
    '}x = 4;'
).hasResult({ line: 2, position:1, fixedText:'\n' });});

test('lint string tab escape does not work', () => { lintingStatements(
    'x = "\\t";'
).hasResult({ line: 0, position:5, length:2 });});

test('lint names cannot have space', () => { lintingStatements(
    "x = 'a cat';"
).hasResult({ line: 0, position:4, length:7, originalText:"'a cat'" });});

test('lint operator spacing removes space in default properties', () => { linting([
    'defaultproperties',
    '{',
    '\tDescription = "Your description here!"',
    '}'
])
    .hasResult({ line: 2, position:12, length:1, fixedText: '' })
    .hasResult({ line: 2, position:14, length:1, fixedText: '' });
});

test('lint operator spacing does not suggest adding space in defaultproperties', () => { linting([
    'defaultproperties',
    '{',
    '\tDescription="Your description here!"',
    '}'
]).hasNoLintResults();});

test('lint class name reference can contain dot', () => { lintingStatements(
    "c = class'Engine.Weapon'"
).hasNoLintResults();});

test.skip('lint multiline boolean condition', () => { lintingStatements(
    "return WeaponIndex >= 0",
    "	&& PlayerPawn.Weapon != None",
    "	&& PlayerPawn.Weapon.Class == Weapons.GetWeaponClass(WeaponIndex);" // missing indent
).hasNoLintResults();});

function linting(lines: string[], lineOffset = 0, positionOffset = 0) {
    const parser = new UcParser();
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    const ast = parser.getAst();
    ast.textLines = lines;

    let results: LintResult[] = [];
    for (const rule of ALL_AST_RULES){
        const result = rule.lint(ast);
        if (result){
            results = [...results, ...result];
        }
    }

    for (const token of ast.tokens){
        for (const rule of ALL_V2_TOKEN_RULES) {
            const result = rule.nextToken(token, ast.textLines);
            if (result != null){
                results.push(...result);
            }
        }
    }
    
    for (const result of results){
        if (result.line != null)
        {
            result.line += lineOffset;
        }
        if (result.position != null)
        {
            result.position += positionOffset;
        }
    }

    const checks = {
        hasResult(obj: LintResult){
            let bestMatch: LintResult | null = null;
            let bestScore = 0;
            for (const result of results){
                let score = 
                    Number(result.line === obj.line)*2 +
                    Number(result.position === obj.position)*3 +
                    Number(result.length === obj.length) +
                    Number(result.message === obj.message) +
                    Number(result.originalText === obj.originalText) +
                    Number(result.fixedText === obj.fixedText) +
                    Number(result.severity === obj.severity);
                if (score > bestScore){
                    bestScore = score;
                    bestMatch = result;
                }
            }
            expect(bestMatch).toMatchObject(obj);
            return checks;
        },
        hasNoLintResults() {
            expect(results).toHaveLength(0);
        }
    };

    return checks;
}

function lintingStatements(...statementLines: string[]){
    return linting(statementWrapper(...statementLines), -2, -1);
}

function statementWrapper(...statementLines: string[]){
    return [
        'function F()',
        '{',
        ...statementLines.map(l => `\t${l}`),
        '}'
    ];
}
