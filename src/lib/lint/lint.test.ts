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
        '    if ( bVerify )',
        '        if ( bEnabled )',
        '        {',
        '            Count = 0;',
        '        }',
        '}'
    ]).hasNoLintResults();
});

test('lint indent multiline argument expression', () => {
    linting([
        'function Init()',
        '{',
        '    if ( bEnabled',
        '    &&bAnotherEnabled )', // should have 2 indent
        '    {',
        '    }',
        '}'
    ]).hasFormattedResult([
        'function Init()',
        '{',
        '    if ( bEnabled',
        '        && bAnotherEnabled )',
        '    {',
        '    }',
        '}'
    ]);
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
    ]).isAlreadyWellFormatted();
});

test('lint indent only increases once when multiple scopes combine on same line', () => {
    linting([
        'function Init() {',
        '    if ( c < 10 ) { if ( c > 5 ) {',
        '        Log("test");',
        '    }}',
        '}'
    ], {
        enableBracketSpacingRule: false // needed to test the feature
    }).isAlreadyWellFormatted();
});

test('lint indent single statement if without braces', () => {
    linting([
        'function Init()',
        '{',
        '    if ( bFirstRun )',
        '        SaveConfig();',
        '}'
    ]).isAlreadyWellFormatted();
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
        '    if ( CheckSomething() )',
        '    {',
        '        SaveConfig();',
        '    }',
        '}',
    ]).isAlreadyWellFormatted();
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

test('state labels well formatted', () => {linting([
    'state wandering',
    '{',
    'Begin:',
    '    SetPhysics(PHYS_Swimming);',
    '}']
).isAlreadyWellFormatted();});

test('indent switch case well formatted', () => { lintingStatements(
    'switch (A)',
    '{',
    '    case 0: return 1;',
    '    case 1:',
    '        return 2;',
    '    case 2:',
    '        Log("case 2");',
    '        return 2;',
    '    default:',
    '        Log("NotSupported");',
    '        return -1;',
    '}',
).isAlreadyWellFormatted();});


test('semicolon autocomplete inside switch case', () => { lintingStatements(
    'switch (A)',
    '{',
    '    case 0: break',
    '    case 1: break',
    '    default:',
    '}',
).hasFormattedResult(statementWrapper(
    'switch (A)',
    '{',
    '    case 0: break;',
    '    case 1: break;',
    '    default:',
    '}',
));});


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

test('lint operator space is not removed after subtracting from paren', () => { lintingStatements(
    'x = (a >> 1) - c;',
).hasFormattedResult(statementWrapper(
    'x = (a >> 1) - c;',
));});

test('lint operator spacing not applied to increment/decrement', () => { lintingStatements(
    'x++;',
    '++x;',
    'x--;',
    '--x;',
).hasFormattedResult(statementWrapper(
    'x++;',
    '++x;',
    'x--;',
    '--x;',
));});


test('lint operator spacing does not remove space between operator and parenthesis', () => { lintingStatements(
    'expre = ( !value );'
).hasFormattedResult(statementWrapper(
    'expre = ( !value );'
));});

test('lint None formatting correction', () => { lintingStatements(
    'x = none;'
).hasFormattedResult(statementWrapper(
    'x = None;'
));});
    
test('format string remove space between string concat operator', () => { lintingStatements(
    'a = "test"$i;',
    'a = "test" $ i;',
    'a = i $ "test";',
    'a = "test" @ i;',
    'a = i @ "test";',
).hasFormattedResult(statementWrapper(
    'a = "test"$i;',
    'a = "test"$i;',
    'a = i$"test";',
    'a = "test"@i;',
    'a = i@"test";',
));});

test('lint operator subtract and add should have space', () => { lintingStatements(
    'x = a+list[i];',
    'x = a-list[i];',
    'x = a-1;',
    'x = a+1;'
).hasFormattedResult(statementWrapper(
    'x = a + list[i];',
    'x = a - list[i];',
    'x = a - 1;',
    'x = a + 1;'
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
    'if ( bFirst ){',
    '}'
).hasFormattedResult(statementWrapper(
    'if ( bFirst )',
    '{',
    '}'
));});

test('lint newline after {', () => { lintingStatements(
    'if ( bFirst )',
    '{x = True;',
    '}'
).hasFormattedResult(statementWrapper(
    'if ( bFirst )',
    '{',
    '    x = True;',
    '}'
));});

test('lint newline before }', () => { lintingStatements({ indentEnabled: false },
    'if ( bFirst )',
    '{',
    '    x = False;}'
).hasFormattedResult(statementWrapper(
    'if ( bFirst )',
    '{',
    '    x = False;',
    '}'
));});

test('lint newline after }', () => { lintingStatements(
    'if ( bFirst )',
    '{',
    '}x = 4;'
).hasFormattedResult(statementWrapper(
    'if ( bFirst )',
    '{',
    '}',
    'x = 4;'
));});

test('lint autocompletes semicolon for single statement', () => { lintingStatements(
    'A = 1',
).hasFormattedResult(statementWrapper(
    'A = 1;'
));});

test('lint autocompletes semicolon for return statement', () => { lintingStatements(
    'return 1',
).hasFormattedResult(statementWrapper(
    'return 1;'
));});

test('lint autocompletes semicolon for continue statement', () => { lintingStatements(
    'continue',
).hasFormattedResult(statementWrapper(
    'continue;'
));});

test('lint autocompletes semicolon for break statement', () => { lintingStatements(
    'break',
).hasFormattedResult(statementWrapper(
    'break;'
));});

test('lint autocompletes semicolon for statement with super', () => { lintingStatements(
    'Super.Notify(C,E)',
).hasFormattedResult(statementWrapper(
    'Super.Notify(C,E);'
));});

test('lint autocompletes semicolon for statement with super', () => { lintingStatements(
    'Self.Notify(C,E)',
).hasFormattedResult(statementWrapper(
    'Self.Notify(C,E);'
));});

test('lint autocompletes semicolon for nested return statement', () => { linting([
    'function GetResult()',
    '{',
    '    if ( bNotFound )',
    '    {',
    '        return -1',
    '    }',
    '    return 1',
    '}',
]).hasFormattedResult([
    'function GetResult()',
    '{',
    '    if ( bNotFound )',
    '    {',
    '        return -1;',
    '    }',
    '    return 1;',
    '}',
]);});

test('lint autocompletes semicolon in new class statement', () => { lintingStatements(
    "A = new class'TestClass'",
).hasFormattedResult(statementWrapper(
    "A = new class'TestClass';",
));});

test('lint does not add semicolon in middle of the new class statement', () => { lintingStatements(
    "A = new class'TestClass';",
).hasFormattedResult(statementWrapper(
    "A = new class'TestClass';",
));});

test('lint does not add semicolon in middle of the new(self) class statement', () => { lintingStatements(
    "A = new(self) class'TestClass';",
).hasFormattedResult(statementWrapper(
    "A = new(Self) class'TestClass';",
));});

test('lint autocompletes semicolon function call statemetns', () => { lintingStatements(
    'A(1)',
    'B(1, 2, 3)',
).hasFormattedResult(statementWrapper(
    'A(1);',
    'B(1, 2, 3);',
));});

test('lint does not add semicolon when accessing default values', () => { lintingStatements(
    'Canvas.DrawColor = Canvas.default.DrawColor;',
    'BaseEyeHeight = default.BaseEyeHeight;',
).isAlreadyWellFormatted();});

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

test.skip('formatting defaultproperties removes semicolons', () => { linting([
    'defaultproperties',
    '{',
    '    Count=0;',
    '}'
]).hasFormattedResult([
    'defaultproperties',
    '{',
    '    Count=0',
    '}'
]);});

test('lint class name reference can contain dot', () => { lintingStatements(
    "c = class'Engine.Weapon';"
).hasNoLintResults();});

test('lint multiline boolean condition', () => { lintingStatements(
    "return WeaponIndex >= 0",
    "    && PlayerPawn.Weapon != None",
    "    && PlayerPawn.Weapon.Class == Weapons.GetWeaponClass(WeaponIndex);" // missing indent
).isAlreadyWellFormatted();});

test('linting multiline variable declaration', () => { 
    linting([
        '// Light properties.',
        'var(Lighting) byte',
        'LightRadius,',
        'LightPeriod,',
        'LightPhase,',
        'LightCone,',
        'VolumeBrightness,',
        'VolumeRadius,',
        'VolumeFog;',
    ]).hasFormattedResult([
        '// Light properties.',
        'var(Lighting) byte',
        '    LightRadius,',
        '    LightPeriod,',
        '    LightPhase,',
        '    LightCone,',
        '    VolumeBrightness,',
        '    VolumeRadius,',
        '    VolumeFog;',
    ]);
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
    'if (! ShouldApplyTo(Game))',
    '{',
    '    enabled = ! enabled;',
    '}'
).hasFormattedResult(statementWrapper(
    'if ( !ShouldApplyTo(Game) )',
    '{',
    '    enabled = !enabled;',
    '}'
));});

test('format no change on well formatted negation of variable', () => { lintingStatements(
    "x = !x;"
).hasFormattedResult(statementWrapper(
    "x = !x;"
));});

test('format no change on well formatted negation of function return', () => { lintingStatements(
    "x = !TestSomething();"
).hasFormattedResult(statementWrapper(
    "x = !TestSomething();"
));});

test('format no change on well formatted negation of static function return', () => { lintingStatements(
    "x = !class'Util'.static.TestSomething(Level);"
).hasFormattedResult(statementWrapper(
    "x = !class'Util'.static.TestSomething(Level);"
));});

test('format no change on well formatted new class instantiation', () => { lintingStatements(
    "MapTagsConfig = new class'MapTagsConfig';"
).hasFormattedResult(statementWrapper(
    "MapTagsConfig = new class'MapTagsConfig';"
));});

test('super keywords are capitalized', () => { lintingStatements(
    "super.PostBeginPlay();"
).hasFormattedResult(statementWrapper(
    "Super.PostBeginPlay();"
));});

test('self keywords are capitalized', () => { lintingStatements(
    "Log(self.Class);"
).hasFormattedResult(statementWrapper(
    "Log(Self.Class);"  
));});

test.skip('default keyords in expressions are capitalized', () => { lintingStatements(
    "W.EntryActor = WaterZoneType.default.EntryActor;"
).hasFormattedResult(statementWrapper(
    "W.EntryActor = WaterZoneType.Default.EntryActor;"  
));});

test('format removes useless default int properties', () => { linting([
    'var int a;',
    'var int b;',
    '',
    'defaultproperties',
    '{',
    '    a=0',
    '    b=1',
    '};',
]).hasFormattedResult([
    'var int a;',
    'var int b;',
    '',
    'defaultproperties',
    '{',
    '    ',  // check to see if line can be removed
    '    b=1',
    '};',
]);});

test('format removes useless default float properties', () => { linting([
    'var float a,b,c;',
    '',
    'defaultproperties',
    '{',
    '    a=0',
    '    b=0.85',
    '    c=1.0',
    '};',
]).hasFormattedResult([
    'var float a,b,c;',
    '',
    'defaultproperties',
    '{',
    '    ',  // check to see if line can be removed
    '    b=0.85',
    '    c=1.0',
    '};',
]);});

test('format if control condition spacing', () => { lintingStatements(
    "if (bDebug)",
    "{",
    "}",
).hasFormattedResult(statementWrapper(
    "if ( bDebug )",
    "{",
    "}",
));});

test('format for condition correctly spaced', () => { lintingStatements(
    "for ( i = 0; i < PreventDeathListenerCount; i++ )",
    "{",
    "}",
).hasFormattedResult(statementWrapper(
    "for ( i = 0; i < PreventDeathListenerCount; i++ )",
    "{",
    "}",
));});

test('format space is not introduces in middle of identifier', () => { lintingStatements(
    "if ( PlayerOwner.GameReplicationInfo == None",
    "        || (Canvas.ClipX < 640))",
    "    return;"
).hasFormattedResult(statementWrapper(
    "if ( PlayerOwner.GameReplicationInfo == None",
    "        || (Canvas.ClipX < 640) )",
    "    return;"
));});



test('checks class name to be filename', () => { linting([
    'class SomeClass extends Object;'
], undefined, './something/AnotherClass.uc').hasResult({
    message: "Class names should match file names, expected class name: AnotherClass"
});});

test('checks class declaration to exists', () => { linting([
], undefined, './something/AnotherClass.uc').hasResult({
    message: "Missing class declaration"
});});

test('class name is correctly set', () => { linting([
    'class SomeClass extends Object;'
], undefined, './something/SomeClass.uc').hasNoLintResults();});

test('class name is correctly set, but filename is not', () => { linting([
    'class SomeClass extends Object;'
], undefined, './something/Some-Class.uc').hasResult({
    message: "File names should match class names, expected file name: SomeClass.uc"
});});

test('class name not having correct casing', () => { linting([
    'class something extends Object;'
], undefined, './something/Some-Class.uc').hasResult({
    message: "Class names should be in PascalCase"
});});

test('do not complain about underscores in class names', () => { linting([
    'class AB_Something extends Object;'
], undefined, './something/AB_Something.uc').hasNoLintResults();});

test('return statement warning when no return statement', () => { linting([
    "static function string GetMessage()",
    "{",
    "}",
]).hasResult({
    message: "Function does not have return statement, expected a string return value!"
});});

test('return statement warning when no argument in return statement', () => { linting([
    "static function string GetMessage()",
    "{",
    "    return;",
    "}",
]).hasResult({
    message: "Missing argument on return statement, expected a string return value!"
});});

test('return statement warning when returning in function without return type', () => { linting([
    "static function DoSomething()",
    "{",
    "    return 1;",
    "}",
]).hasResult({
    message: "Should not have return value when function does not have a declared return type!"
});});

test('unused local variable is reported', () => { linting([
    "static function DoSomething()",
    "{",
    "    local Projectile A;",
    "}",
]).hasResult({
    message: "Unused local variable A!"
});});

test('unused local variable not reported when used', () => { linting([
    "static function DoSomething()",
    "{",
    "    local Projectile A;",
    "    Log(A);",
    "}",
]).hasNoLintResults();});

test('unused local variable not reported when used in function call', () => { linting([
    "function TestFn()",
    "{",
    "    local Color Color;",
    "    PP.SetProgressColor(Color, 3);",
    "}",
]).hasNoLintResults();});

test('unused local variable not reported when used in for loop', () => { linting([
    "function TestFn()",
    "{",
    "    local int i;",
    "    for ( i = 0; i < 10; i += 1 )",
    "        Log(\"Hi!\");",
    "}",
]).hasNoLintResults();});



function linting(lines: string[], options?: Partial<FullLinterConfig>, fileName?: string) {
    const parser = new UcParser();
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    const ast = parser.getAst();
    //console.log(ast.functions[0].body[0].body);
    ast.textLines = lines;
    ast.fileName = fileName;

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
        isAlreadyWellFormatted(){
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
