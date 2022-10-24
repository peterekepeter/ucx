import { LintResult } from "./LintResult";
import { UcParser, ucTokenizeLine } from "..";
import { SourceEditor } from "../transformer";
import { buildFullLinter, FullLinterConfig } from "./buildFullLinter";

test('linting indent class declaration', () => {
    linting([
        'class Test',
        'extends Object;'
    ]).hasResult({
        line: 1,
        position: 0,
        originalText: '',
        fixedText: '    '
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
        fixedText: '    '
    });
});

test('linting indent function body', () => {
    linting([
        'function Init()',
        '{',
        'Count = 0;',
        '}'
    ]).hasFormattedResult([
        'function Init()',
        '{',
        '    Count = 0;',
        '}'
    ]);
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
        fixedText: '    '
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
        fixedText: '    '
    }).hasResult({
        line: 3,
        fixedText: '        '
    }).hasResult({
        line: 4,
        fixedText: '    '
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
    ]).hasResult({ line: 1, fixedText: '    '
    }).hasResult({ line: 2, fixedText: '        '
    }).hasResult({ line: 3, fixedText: '            '
    });
});

test('linting indent if inside if but first if has no brackets', () => {
    linting([
        'function Init()',
        '{',
        '    if (bVerify)',
        '        if (bEnabled)',
        '        {',
        '            Count = 0;',
        '        }',
        '}'
    ]).hasNoLintResults();
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
    ]).hasResult({ line: 3, originalText:'    ', fixedText: '        '});
});

test('closing parenthesis is not indented', () => {
    linting([
        'function Init() {',
        '    if (bEnabled',
        ')', // should have 1 indent, not 2
        '    {', 
        '    }',
        '}'
    ]).hasResult({ line: 2, fixedText: '    '});
});

test('expression closing paranthesis is not indented', () => {
    linting([
        'function Init()',
        '{',
        '    x = (',
        '        3 + 4',
        '    );',
        '}'
    ]).hasNoFormattedResult();
});

test('lint indent only increases once when multiple scopes combine on same line', () => {
    linting([
        'function Init() {',
        '    if (c < 10) { if (c > 5) {',
        '        Log("test");',
        '    }}',
        '}'
    ], {
        enableBracketSpacingRule: false // needed to test the feature
    }).hasNoFormattedResult();
});

test('lint indent single statement if without braces', () => {
    linting([
        'function Init()',
        '{',
        '    if (bFirstRun)',
        '        SaveConfig();',
        '}'
    ]).hasNoFormattedResult();
});

test('lint indent single statment if on one line', () => {
    linting([
        'function Init(object M)',
        '{',
        '   if (M == self) return;',
        '   Count = 0;',
        '}'
    ]).hasResult({ line: 2, fixedText: '    ' 
    }).hasResult({ line: 3, fixedText: '    ' 
    });
});

test('lint indent if with function call in condition', () => {
    linting([
        'function Init()',
        '{',
        '    if (CheckSomething())',
        '    {',
        '        SaveConfig();',
        '    }',
        '}',
    ]).hasNoFormattedResult();
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
    ]).hasResult({ line: 1, fixedText:'    ' 
    }).hasResult({ line: 2, fixedText:'    ' 
    });
});

test("lint indent enum with bracket newline", () => {
    linting([
        'enum TestEnum',
        ' {',
        '   TE_MoreStuff',
        ' }'
    ]).hasResult({ line: 1, fixedText:'' 
    }).hasResult({ line: 2, fixedText:'    ' 
    });
});

test("lint indent default properties", () => {
    linting([
        'defaultproperties {',
        'Description="Your description here!"',
        'DamageModifier=1.0',
        '}',
    ]).hasResult({ line: 1, fixedText:'    ' 
    }).hasResult({ line: 2, fixedText:'    ' 
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
    .hasResult({ line:1, fixedText:'    ' })
    .hasResult({ line:2, fixedText:'    ' });
});

test('indent foreach statement block body', () => { linting([
    /*0*/'function Timer(){',
    /*1*/'local Projectile A;',
    /*2*/'foreach AllActors( class \'Projectile\', A )',
    /*3*/'{',
    /*4*/'Log(A);',
    /*5*/'}',
    /*6*/'}'])
    .hasResult({ line:1, fixedText:'    ' })
    .hasResult({ line:2, fixedText:'    ' })
    .hasResult({ line:3, fixedText:'    ' })
    .hasResult({ line:4, fixedText:'        ' })
    .hasResult({ line:5, fixedText:'    ' });
});

test('indent replication block body', () => { linting([
    /*0*/'replication',
    /*1*/'{',
    /*2*/'reliable if(Role == ROLE_Authority)',
    /*3*/'Pauser, TimeDilation, bNoCheating, bAllowFOV;',
    /*4*/'}',
    /*5*/])
    .hasResult({ line:2, fixedText:'    ' })
    .hasResult({ line:3, fixedText:'        ' });
});

test('indent replication block body', () => { linting([
    /*0*/'replication',
    /*1*/'{',
    /*2*/'    reliable if(Role == ROLE_Authority)',
    /*3*/'        Pauser, TimeDilation, bNoCheating, bAllowFOV;',
    /*4*/'}',
    /*5*/])
    .hasNoLintResults();
});

test('indent replication block body where condition has parenthesis inside', () => { linting([
    /*0*/'replication',
    /*1*/'{',
    /*2*/'    unreliable if( (Role == ROLE_Authority) && (bNetOwner == bSomething) )',
    /*3*/'        AmbientSound;',
    /*4*/'}',
    /*5*/])
    .hasNoLintResults();
});

test('correctly indented struct members', () => { linting([
    /*0*/'struct PointRegion',
    /*1*/'{',
    /*2*/'    var zoneinfo Zone;       // Zone.',
    /*3*/'    var int      iLeaf;      // Bsp leaf.',
    /*4*/'    var byte     ZoneNumber; // Zone number.',
    /*5*/'};'
    /*6*/])
    .hasNoLintResults();
});

test('incorrectly indented struct', () => { linting([
    /*0*/'struct PointRegion',
    /*1*/'{',
    /*2*/'var zoneinfo Zone;       // Zone.',
    /*3*/'var int      iLeaf;      // Bsp leaf.',
    /*4*/'var byte     ZoneNumber; // Zone number.',
    /*5*/'};'
    /*6*/])
    .hasResult({ line:2, fixedText:'    ' })
    .hasResult({ line:3, fixedText:'    ' })
    .hasResult({ line:4, fixedText:'    ' });
});

test('incorrectly indented state with function', () => { linting([
    /*0*/`state Voting`,
    /*1*/`{`,
    /*2*/`event BeginState()`,
    /*3*/`{`,
    /*4*/`bVotingStage = True;`,
    /*5*/`VotingStagePreBeginWait = 0;`,
    /*6*/`CountMapVotes();`,
    /*7*/`}`,
    /*8*/`}`,
    /*9/*/])
    .hasResult({ line:2, fixedText:'    ' })
    .hasResult({ line:3, fixedText:'    ' })
    .hasResult({ line:4, fixedText:'        '})
    .hasResult({ line:5, fixedText:'        '})
    .hasResult({ line:6, fixedText:'        '})
    .hasResult({ line:7, fixedText:'    '})
;});

test('incorrectly indented state with control statements', () => { linting([
    /*0*/`state TestState`,
    /*1*/`{`,
    /*2*/`while (WaitedSeconds < 5){`,
    /*3*/`Sleep(1);`,
    /*4*/`WaitedSeconds += 1;`,
    /*5*/`}`,
    /*6*/`}`,
    /*7*/])
    .hasResult({ line:2, fixedText:'    ' })
    .hasResult({ line:3, fixedText:'        ' })
    .hasResult({ line:4, fixedText:'        ' })
    .hasResult({ line:5, fixedText:'    ' })
;});

test('correctly formatted enum has no linter errors', () => { linting([
    'enum ESoundSlot',
    '{',
    '    SLOT_None,',
    '    SLOT_Misc,',
    '    SLOT_Pain,',
    '    SLOT_Interact,',
    '    SLOT_Ambient,',
    '    SLOT_Talk,',
    '    SLOT_Interface,',
    '};',])
    .hasNoLintResults();
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
).hasFormattedResult(statementWrapper(
    'count = 0;'
));});

test('lint operator too much space before operator', () => { lintingStatements(
    'count   = 0;'
).hasFormattedResult(statementWrapper(
    'count = 0;'
));});

test('lint operator not enough space after operator', () => { lintingStatements(
    'count =0;'
).hasFormattedResult(statementWrapper(
    'count = 0;'
));});

test('lint operator too much space after operator', () => { lintingStatements(
    'count =   0;'
).hasFormattedResult(statementWrapper(
    'count = 0;'
));});

test('lint operator space just right', () => { lintingStatements(
    'count = 0;'
).hasNoLintResults();});

test('lint operator negation should not have space', () => { lintingStatements(
    'x = - 1;'
).hasFormattedResult(statementWrapper(
    'x = -1;'
));});

test('lint None formatting correction', () => { lintingStatements(
    'x = none;'
).hasFormattedResult(statementWrapper(
    'x = None;'
));});
    

test('lint None is correctly formatted', () => { lintingStatements(
    'x = None;'
).hasFormattedResult(statementWrapper(
    'x = None;'
));});

test('lint True/False is correctly formatted', () => { lintingStatements(
    'x = True;',
    'x = False;'
).hasFormattedResult(statementWrapper(
    'x = True;',
    'x = False;'
));});

test('lint True/False formatting correction', () => { lintingStatements(
    'x = true;',
    'x = false;'
).hasFormattedResult(statementWrapper(
    'x = True;',
    'x = False;'
));});

test('lint newline before {', () => { lintingStatements(
    'if (bFirst){',
    '}'
).hasFormattedResult(statementWrapper(
    'if (bFirst)',
    '{',
    '}'
));});

test('lint newline after {', () => { lintingStatements(
    'if (bFirst)',
    '{x = True;',
    '}'
).hasFormattedResult(statementWrapper(
    'if (bFirst)',
    '{',
    '    x = True;',
    '}'
));});

test('lint newline before }', () => { lintingStatements({ indentEnabled: false },
    'if (bFirst)',
    '{',
    '    x = False;}'
).hasFormattedResult(statementWrapper(
    'if (bFirst)',
    '{',
    '    x = False;',
    '}'
));});

test('lint newline after }', () => { lintingStatements(
    'if (bFirst)',
    '{',
    '}x = 4;'
).hasFormattedResult(statementWrapper(
    'if (bFirst)',
    '{',
    '}',
    'x = 4;'
));});

test('lint autocompletes semicolon for single statement', () => { lintingStatements(
    'A = 1',
).hasFormattedResult(statementWrapper(
    'A = 1;'
));});

test('lint warning string tab escape does not work', () => { lintingStatements(
    'x = "\\t";'
).hasResult({ message: "The '\\t' doesn't work in unreal strings." });});

test('lint names cannot have space', () => { lintingStatements(
    "x = 'a cat';"
).hasResult({ message:'Names cannot contain spaces!', originalText:"'a cat'" });});

test('lint operator spacing removes space in default properties', () => { linting([
    'defaultproperties',
    '{',
    '    Description = "Your description here!"',
    '}'
]).hasFormattedResult([
    'defaultproperties',
    '{',
    '    Description="Your description here!"',
    '}'
]);});

test('lint operator spacing does not suggest adding space in defaultproperties', () => { linting([
    'defaultproperties',
    '{',
    '    Description="Your description here!"',
    '}'
]).hasNoLintResults();});

test('lint class name reference can contain dot', () => { lintingStatements(
    "c = class'Engine.Weapon';"
).hasNoLintResults();});

test.skip('lint multiline boolean condition', () => { lintingStatements(
    "return WeaponIndex >= 0",
    "	&& PlayerPawn.Weapon != None",
    "	&& PlayerPawn.Weapon.Class == Weapons.GetWeaponClass(WeaponIndex);" // missing indent
).hasNoLintResults();});

test.skip('linting multiline variable declaration', () => { 
    linting([
        /*0*/'// Light properties.',
        /*1*/'var(Lighting) byte',
        /*2*/'LightRadius,',
        /*3*/'LightPeriod,',
        /*4*/'LightPhase,',
        /*5*/'LightCone,',
        /*6*/'VolumeBrightness,',
        /*7*/'VolumeRadius,',
        /*8*/'VolumeFog;',
    ])
        .hasResult({ line: 2, position: 0, originalText: '', fixedText: '    ' })
        .hasResult({ line: 3, position: 0, originalText: '', fixedText: '    ' })
        .hasResult({ line: 4, position: 0, originalText: '', fixedText: '    ' })
        .hasResult({ line: 5, position: 0, originalText: '', fixedText: '    ' })
        .hasResult({ line: 6, position: 0, originalText: '', fixedText: '    ' })
        .hasResult({ line: 7, position: 0, originalText: '', fixedText: '    ' })
        .hasResult({ line: 8, position: 0, originalText: '', fixedText: '    ' })
    ;
});

test('lint struct indentation', () => { linting([
    '// Identifies a unique convex volume in the world.',
    'struct PointRegion',
    '{',
    'var zoneinfo Zone;       // Zone.',
    'var int      iLeaf;      // Bsp leaf.',
    'var byte     ZoneNumber; // Zone number.',
    '};',
]).hasFormattedResult([
    '// Identifies a unique convex volume in the world.',
    'struct PointRegion',
    '{',
    '    var zoneinfo Zone;       // Zone.',
    '    var int      iLeaf;      // Bsp leaf.',
    '    var byte     ZoneNumber; // Zone number.',
    '};',
]);});


test('format negation operator spacing', () => { lintingStatements(
    'if ( ! ShouldApplyTo(Game))',
    '{',
    '    enabled = ! enabled;',
    '}'
).hasFormattedResult(statementWrapper(
    'if (!ShouldApplyTo(Game))',
    '{',
    '    enabled = !enabled;',
    '}'
));});
    

function linting(lines: string[], options?: Partial<FullLinterConfig>) {
    const parser = new UcParser();
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    const ast = parser.getAst();
    ast.textLines = lines;

    let results: LintResult[] = buildFullLinter({
        indentType: '    ',
        ...options,
    }).lint(ast);

    const checks = {
        hasResult(obj: LintResult){
            let bestMatch: LintResult | null = results[0];
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
        },
        hasFormattedResult(expectedLines: string[]){
            expect(applyLinterFixes(lines, results)).toEqual(expectedLines.join('\n'));
        },
        hasNoFormattedResult(){
            expect(applyLinterFixes(lines, results)).toEqual(lines.join('\n'));
        }
    };

    return checks;
}

function lintingStatements(...statementLines: string[]): ReturnType<typeof linting>;
function lintingStatements(options?: Partial<FullLinterConfig>, ...statementLines: string[]): ReturnType<typeof linting>;
function lintingStatements(options?: Partial<FullLinterConfig>| string, ...statementLines: string[]){
    return (typeof options === "string") ? linting(statementWrapper(options, ...statementLines)) : linting(statementWrapper(...statementLines), options);
}

function statementWrapper(...statementLines: string[]){
    return [
        'function Timer()',
        '{',
        ...statementLines.map(l => `    ${l}`),
        '}'
    ];
}

function applyLinterFixes(source: string | string[], results: LintResult[]){
    const editor = new SourceEditor(source);
    for (const result of results){
        if (result.fixedText != null && result.line != null && result.position != null && result.length != null){
            editor.replace(result.line, result.position, result.length, result.fixedText);
        }
    }
    return editor.result;
}
