import { ucParseLines } from "../parser/ucParse";
import { ClassDatabase, CompletionInformation, TokenInformation } from "./ClassDatabase";
import { renderDefinitionMarkdownLines } from "./renderDefinitonMarkdownLines";

let db: ClassDatabase;


describe("ast versioning", () => {

    beforeEach(() => db = new ClassDatabase());

    const uri = "MyClass.uc";

    test('getVersion returns -Infinity when uri not found', () => {
        expectVersion(uri, -Infinity);
    });
    
    test('getVersion returns version number when ast added first', () => {
        addVersion(1);
        expectVersion(uri, 1);
    });
    
    test('getVersion returns latest version', () => {
        addVersion(1);
        addVersion(2);
        expectVersion(uri,  2);
    });
    
    test('getVersion returns highest', () => {
        addVersion(1);
        addVersion(0);
        expectVersion(uri,  1);
    });

    const addVersion = (v: number) => ast(uri, v, ["class MyClass;"]);

});

describe("definitions inside single file", () => {

    const uri = "SomeClass.uc";

    beforeAll(() => {
        db = new ClassDatabase();
        ast(uri, 1, [
            'class SomeClass extends Info;', // line 0
            'struct MyStruct { var string Name; };',
            'const NOTHING = -1;',
            'var config string tag;',
            'var config MyStruct MyStructVar, MyVars[4];',
            '',
            'function PostBeginPlay(string name) {', // line 6
            '    local int i;',
            '    for (i=0; i<10; i+=1) Log(tag$name);',
            '    DebugPrint();',
            '}',
            '',
            'function bool DebugPrint() {', // line 12
            '    Log(tag);',
            '    Log(NOTHING);',
            '    Log(MyStructVar.Name);', // 15
            '    Log(MyVars[0].Name);',
            '}',
        ]);
    });

    test('searching in another file resutls in missing ast', () => {
        expect(db.findToken('asdasdas', 0, 0).missingAst).toBe(true);
    });
    
    describe('findToken', () => test.each([
        [0, 1, { found: true }],
        [0, 100, { found: false }],
        [0, 1, { token: { text: 'class' } }],
        [0, 6, { token: { text: 'SomeClass' } }],
        [6, 32, { 
            token: {text: 'name'}, 
            functionScope: { name: { text: 'PostBeginPlay' }},
            uri: uri,
            ast: {},
        }],
        [8, 9, { 
            token: { text: 'i' }, 
            functionScope: { name: { text: 'PostBeginPlay' }},
        }] as [number, number, TokenInformation],
    ])("at %p:%p results %p", (line, column, expected) => {
        expect(db.findToken(uri, line, column)).toMatchObject(expected);
    }));

    describe('findLocalDefinition', () => test.each([
        [8, 9, { 
            token: { text: 'i', line: 7 }, 
            localDefinition: { type: { text: 'int' }},
        }],
        [8, 10, { // also works on last char
            token: { text: 'i', line: 7 }, 
            localDefinition: { type: { text: 'int' }},
        }],
        [9, 9, { 
            token: { text: 'DebugPrint' }, 
            fnDefinition: { name: { text: 'DebugPrint' }},
        }] as [number, number, TokenInformation],
        [2, 9, { 
            token: { text: 'NOTHING', line: 2 }, 
            constDefinition: { name: { text: 'NOTHING' }},
        }],
        [4, 15, { 
            token: { text: 'MyStruct', line: 1 }, 
            structDefinition: { name: { text: 'MyStruct' }},
        }],
        [15, 22,  {
            token: { text: 'Name', line: 1 }, 
            structDefinition: { name: { text: 'MyStruct' }},
            varDefinition: { name: { text: 'Name' }},
        }],
        [15, 22,  {
            token: { text: 'Name', line: 1 }, 
            structDefinition: { name: { text: 'MyStruct' }},
            varDefinition: { name: { text: 'Name' }},
        }],
        [16, 20,  {
            token: { text: 'Name', line: 1 }, 
            structDefinition: { name: { text: 'MyStruct' }},
            varDefinition: { name: { text: 'Name' }},
        }]
    ] as [number, number, TokenInformation][]
    )("at %p:%p results %p", (line, column, expected) => {
        const token = db.findSymbolToken(uri, line, column);
        const definition = db.findLocalFileDefinition(token);
        expect(definition.found).toBe(true);
        expect(definition.uri).toBe(uri);
        expect(definition).toMatchObject(expected);
    }));

    describe('markdown definition', () => test.each([
        [2, 9, ['\tconst NOTHING = -1']],
        [8, 9, ['\tlocal int i']],
        [8, 35, ['\t(parameter) string name']],
        [8, 31, ['\tvar config string SomeClass.tag']],
        [9, 9, ['\tfunction bool SomeClass.DebugPrint();']],
        [0, 9, ['\tclass SomeClass extends Info']],
        [1, 9, ['\tstruct MyStruct']],
        [15, 22, ['\t(struct var) string MyStruct.Name']],
    ] as [number, number, string[]][]
    )("at %p:%p is %p", (line, column, expected) => {
        const info = db.findLocalFileDefinition(db.findToken(uri, line, column));
        expect(renderDefinitionMarkdownLines(info)).toEqual(expected);
    }));

});

describe(renderDefinitionMarkdownLines, () => {

    const uri = "MyClass.uc";

    beforeAll(reset);

    describe("functions", () => {

        beforeAll(() => {
            ast("Object.uc", 1, [
                'class Object;',
                'native(163) static final preoperator  int  ++ ( out byte A );',
            ]);
            ast(uri, 1, [
                'class MyClass extends Object;',
                'native function string ConsoleCommand( string Command );',
                'event Spawned();',
                'state Swimming{ event BeginState(){} }',
                'native(256) final latent function Sleep( float Seconds );',
                'native(130) static final operator(30) bool  && ( bool A, skip bool B );',
                'native(129) static final preoperator  bool  !  ( bool A );',
                'native(165) static final postoperator int  ++ ( out int A );',
                'native(163) static final preoperator  int  ++ ( out int A );',
                'native(127) static final function string Mid( coerce string S, int i, optional int j)'
            ]);   
        });

        test.each([
            [1, 30, ['\tnative function string MyClass.ConsoleCommand(string Command);']],
            [2, 9, ['\tevent MyClass.Spawned();']],
            [3, 25, ['\tevent MyClass.Swimming.BeginState();']],
            [3, 25, ['\tevent MyClass.Swimming.BeginState();']],
            [4, 36, ['\tnative(256) final latent function MyClass.Sleep(float Seconds);']],
            [5, 44, ['\tnative(130) static final operator(30) bool MyClass.&&(bool A, skip bool B);']],
            [6, 44, ['\tnative(129) static final preoperator bool MyClass.!(bool A);']],
            [7, 44, [
                '\tnative(165) static final postoperator int MyClass.++(out int A);', // markdown renders
                '\tnative(163) static final preoperator int MyClass.++(out int A);', // all overloads 
                '\tnative(163) static final preoperator int Object.++(out byte A);', // even from parent
            ]],
            [9, 43, ['\tnative(127) static final function string MyClass.Mid(coerce string S, int i, optional int j);']],
        ] as [number, number, string[]][]
        )("at %p:%p is %p", (line, column, expected) => {
            const info = db.findDefinition(db.findToken(uri, line, column));
            expect(renderDefinitionMarkdownLines(info)).toEqual(expected);
        });

    });

});

describe("definition in states", () => {
    
    const uri = "SomeClass.uc";
    
    beforeAll(() => {
        db = new ClassDatabase();
        ast(uri, 1, [
            'class Cow extends ScriptedPawn;', // line 0
            '',
            'state Grazing {',
            '   function PickDestination() {', // line 3
            '       TestDirection();',
            '   }',
            '   function TestDirection() {',
            '   }', 
            `}`,
        ]);
    });

    describe('findToken', () => test.each([
        [3, 14, { 
            found: true, 
            token: { text: 'PickDestination'},
            stateScope: { name: { text: 'Grazing'} },
        }],
    ])("at %p:%p results %p", (line, column, expected) => {
        expect(db.findToken(uri, line, column)).toMatchObject(expected);
    }));

    describe('findLocalDefinition', () => test.each([
        [4, 10, { 
            token: { text: 'TestDirection', line: 6 }, 
            fnDefinition: { name: { text: 'TestDirection' } },
            stateScope: { name: { text: 'Grazing'} },
        }],
    ] as [number, number, TokenInformation][]
    )("at %p:%p results %p", (line, column, expected) => {
        const token = db.findSymbolToken(uri, line, column);
        const definition = db.findLocalFileDefinition(token);
        expect(definition).toMatchObject(expected);
    }));

    // TODO test find all references for state function


});

describe("definition across files", () => {

    const uriA = "PackageName/Classes/ClassA.uc";
    const uriB = "PackageName/Classes/ClassB.uc";
    const uriCanvas = "Engine/Classes/Canvas.uc";

    beforeAll(() => {
        db = new ClassDatabase();
        ast(uriA, 1, [
            'class ClassA;', // line 0
            'struct Item { var string GameName; };',
            'var int Count;',
            'static function ShowStartMessage(){}',
            'static function string Mid ( coerce string S, int i, optional int j );',
        ]);
        ast(uriCanvas, 1, [
            'class Canvas;', // line 0
            'const NOTHING = -1;',
            'function Reset() {}',
        ]);
        ast(uriB, 1, [
            'class ClassB extends ClassA;', // line 0
            'var Item myitem;',
            'var ClassA other;', // line 2
            '',
            'function Timer(){',
            '   Count += 1;', // line 5
            '}',
            '',
            'function ClassA MakeCopy(ClassA other){',  // line 8
            '   local ClassA copy;',
            `   copy = new class'ClassA';`, // line 10
            '}',
            '',
            'function ClassA GetHud() {', // line 13
            '   return Spawn(Class\'PackageName.ClassA\');',
            '}',
            '',
            'function Draw(canvas canvas){', // line 17
            '   canvas.Reset();',
            '   other.Count += 1;',
            "   class'ClassA'.static.ShowStartMessage(PP);",
            "   Log(class'ClassA'.default.Count);", // line 21
            "   Log(ClassA(self).Count);", // line 22
            "   Mid(Mid(\"Some\", 1, 2), 1, 1);", // line 23
            "   default.other = None;", // line 24
            '}',
            '',
            'function Reset(Canvas canvas) {', // line 27
            '   canvas.Reset();', // line 28
            '   Log(Canvas.NOTHING);',
            '   goto END;',
            'END:', // line 31
            '   Log(myitem.GameName);',
            '}',
        ]);
    });

    const classDefA = { token: { text: 'ClassA' }, uri: uriA };
    const classDefB = { token: { text: 'ClassB' }, uri: uriB };
    const varDefCount = { uri: uriA, varDefinition: { name: { text: 'Count' }} };
    const varDefOther = { uri: uriB, varDefinition: { name: { text: 'other' }} };
    const paramDefCanvas = { uri:uriB, paramDefinition: { name: { text: 'canvas'} }};
    const canvasClassDef = { token: { text: 'Canvas' }, classDefinition: { name: { text: 'Canvas' }}};
    const canvasResetFnDef = { uri:uriCanvas, token: { text: 'Reset', line: 2 }, fnDefinition: { name: { text: 'Reset' }}};
    const showStartMessageFnDef = { uri: uriA, fnDefinition: { name: { text: 'ShowStartMessage' }}};
    const canvasNothingConstDef = { uri:uriCanvas, token: { text: 'NOTHING', line: 1 }};
    const gotoLabelDef = { uri:uriB, token: { text: 'END', line: 31 }, functionScope: { name: { text: 'Reset' }}};
    const nameStructMember = { uri:uriA, token: { text: 'GameName', line: 1 }, varDefinition: { name: { text: 'GameName' }}, structDefinition: { name: { text: 'Item' }} };

    // find definition
    test.each([
        ['self type', 0, 9, classDefB],
        ['parent type', 0, 24, classDefA],
        ['inherited variable', 5, 4, varDefCount],
        ['var type', 2, 7, classDefA],
        ['return type', 8, 13, classDefA], 
        ['parameter type', 8, 28, classDefA],
        ['local type', 9, 12, classDefA],
        ['absolute class reference', 10, 23, classDefA],
        ['absolute package.class reference', 14, 38, classDefA],
        ['function parameter reference', 17, 24, paramDefCanvas],
        ['function parameter type reference', 17, 16, canvasClassDef],
        ['member method call', 18, 12, canvasResetFnDef],
        ['member variable', 19, 11, { uri: uriA, token: { text: 'Count' }}],
        ['static keyword in expression', 20, 20, classDefA],
        ['default keyword in expression', 21, 25, classDefA],
        ['static function', 20, 31, showStartMessageFnDef],
        ['default var', 21, 30, varDefCount],
        ['typecast to class', 22, 10, classDefA],
        ['typecast to class member', 22, 23, varDefCount],
        ['standalone default keyword', 24, 7, classDefB],
        ['standalone default keyword member', 24, 14, varDefOther],
        ['member fn not shadowed by local fn', 28, 11, canvasResetFnDef],
        ['const member', 29, 18, canvasNothingConstDef],
        ['goto label', 30, 10, gotoLabelDef],
        ['inherited struct member', 32, 18, nameStructMember],
    ] as [string, number, number, TokenInformation][]
    )("findCrossFileDefinition finds %p at %p:%p", (_, line, column, expected) => {
        const token = db.findToken(uriB, line, column);
        let definition = db.findLocalFileDefinition(token);
        if (!definition.found) definition = db.findCrossFileDefinition(token);
        expect(definition).toMatchObject({...expected, found: true }); 
    });

    // find signature
    test.each([
        ['method signature', 18, 16, canvasResetFnDef],
        ['static function signature', 20, 42, showStartMessageFnDef],
        ['signature first param', 23, 7, { paramDefinition: { name: { text: 'S'}}}],
        ['signature 2nd param', 23, 20, { paramDefinition: { name: { text: 'i'}}}],
        ['signature 3rd param', 23, 23, { paramDefinition: { name: { text: 'j'}}}],
        ['signature 2nd param but after nested call', 23, 27, { paramDefinition: { name: { text: 'i'}}}],
    ] as [string, number, number, TokenInformation][]
    )("findSignature finds %p at %p:%p", (_, line, column, expected) => {
        let signature = db.findSignature(uriB, line, column);
        expect(signature).toMatchObject({ ...expected, found: true });
    });

    test('find subclasses', () => {
        expect(db.findChildClassesOf("ClassA")).toMatchObject([classDefB]);
    });

    test('find superclass', () => {
        expect(db.findParentClassOf("ClassB")).toMatchObject(classDefA);
    });

});

describe.skip("definition chain complex", () => {

    const uriMessage = "Game/Classes/Message.uc";
    const uriHUD = "Game/Classes/HUD.uc";

    beforeAll(() => {
        db = new ClassDatabase();
        ast(uriMessage, 1, [
            'class Message;',
            '',
            'static function RenderComplexMessage() {', // line 2
            '   ',
            '}',
        ]);
        ast(uriHUD, 1, [
            'class HUD;',
            '',
            'struct HUDMessageExtended {', // line 2
            '   var Class<Message> Message',
            '};',
            '',
            'var HUDMessageExtended MessageQueueExtended[64];', // 6
            '',
            'function Render(int i) {', // 8
            '   MessageQueueExtended[i].Message.Static.RenderComplexMessage();',
            '}',
        ]);
    });

    const classDefMessage = { token: { text: 'Message', line: 0 }, uri: uriMessage };
    const renderComplexDef = { token: { text: 'RenderComplexMessage', line: 2}, uri: uriMessage };

    // find definition
    test.each([
        ['find generic class', 3, 17, classDefMessage],
        ['find static function of generic struct member', 9, 52, renderComplexDef],
    ] as [string, number, number, TokenInformation][]
    )("findCrossFileDefinition finds %p at %p:%p", (_, line, column, expected) => {
        const token = db.findToken(uriHUD, line, column);
        let definition = db.findLocalFileDefinition(token);
        if (!definition.found) definition = db.findCrossFileDefinition(token);
        expect(definition).toMatchObject({...expected, found: true }); 
    });
    
});

describe("completion", () => {

    describe("class name completion", () => {
        
        beforeEach(() => db = new ClassDatabase());

        test("empty file suggests class declaration", () => {
            const uri = '../Package/Classes/MyClass.uc';
            ast(uri, 1, ['']);
            expectCompletion(uri, 0, 0, { label: "class MyClass extends ", retrigger: true });
        });

        test("does not suggest class declaration if class declared", () => {
            const uri = '../Package/Classes/MyClass.uc';
            ast(uri, 1, ['class MyClass extends Actor;', '']);
            expectCompletionCount(uri, 1, 0, 0);
        });

        test("empty file suggests class declaration", () => {
            const uri = 'Awesome.uc';
            ast(uri, 1, ['// new class', 'class ']);
            expectCompletion(uri, 1, 6, { label: "Awesome extends ", retrigger: true });
            expectCompletion(uri, 1, 5, { label: " Awesome extends ", retrigger: true });
            expectCompletionCount(uri, 0, 0, 0);
        });

        test("after extends suggest extendable class names", () => {
            ast("MyOther.uc", 1, ['class MyOther extends Actor;']);
            ast("MyClass.uc", 1, ['class MyClass extends ']);
            expectCompletion("MyClass.uc", 0, 22, "MyOther");
            expectCompletion("MyClass.uc", 0, 22, "Actor");
        });

    });

    describe("object member completion", () => {

        beforeAll(() => {
            db = new ClassDatabase();
            ast("MyOther.uc", 1, [
                'class MyOther;',
                '',
                'function Update(){}',
            ]);
            ast("MyClass.uc", 1, [
                'class MyClass extends MyOther;',
                '',
                'var MyOther VObj;',
                '',
                'function Test(MyOther PObj) {', // line 4
                '    local MyOther LObj; LObj = PObj;',
                '',
                '    PObj.;', // line 7 char 9
                '    VObj.;', // line 8
                '    LObj.;', // line 9
                '    self.;', // line 10
                '    super.;', // line 11 char 10
                '    default.;', // line 12 char 12
                '    4.;',  // line 13 char 6
                '}',
            ]);
        });

        test('through function parameter reference', () => {
            expectCompletion("MyClass.uc", 7, 9, "Update");
        });

        test('through class variable reference', () => {
            expectCompletion("MyClass.uc", 8, 9, "Update");
        });

        test('through local variable reference', () => {
            expectCompletion("MyClass.uc", 9, 9, "Update");
        });

        test('through self reference', () => {
            expectCompletion("MyClass.uc", 10, 9, "Test");
        });

        test('through super reference', () => {
            expectCompletion("MyClass.uc", 11, 10, "Update");
        });

        test('through default reference', () => {
            expectCompletion("MyClass.uc", 12, 12, "VObj");
        });

        test('no completions for dot in floating point numbers', () => {
            expectCompletions("MyClass.uc", 13, 6, { count: 0 });
        });
        
    });

    describe("expression completion", () => {

        beforeAll(() => {
            db = new ClassDatabase();
            ast("Object.uc", 1, [
                'class Object;',
                '',
                'var float A,B;',
                '',
                'function Log(coerce string str, optional string tag){}',
            ]);
            ast("MyObject.uc", 1, [
                'class MyObject extends Object;',
                '',
                'function Test(Object Other) {', // line 2
                '    ', // line 3
                '    A = ;',
                '    Log();',
                '    Log(A,);',
                '}',
            ]);
        });

        test('suggests locally avaiable functions and variables', () => {
            expectCompletion("MyObject.uc", 3, 4, "Other"); // start of statement
            expectCompletion("MyObject.uc", 3, 4, "Test"); // start of statement
            expectCompletion("MyObject.uc", 4, 8, "B"); // after assign operator
            expectCompletion("MyObject.uc", 5, 8, "A"); // after open parenthesis
            expectCompletion("MyObject.uc", 6, 10, "A"); // after comma
        });

        test('suggests inherited avaiable functions and variables', () => {
            expectCompletion("MyObject.uc", 3, 4, "Log");
        });

    });

    describe("name completion", () => {

        beforeAll(() => {
            reset();
            ast("Object.uc", 1, [
                'class Object;',
            ]);
            ast("MyObject.uc", 1, [
                'class MyObject extends Object;',
                '',
                'function Test(Object Other) {', // line 2
                "   class'';",
                "   Class'';",
                "   class'",
                "   class'MyObject'",
                '}',
            ]);
        });

        test('suggests existing classes in class reference', () => {
            expectCompletions("MyObject.uc", 3, 9, { include: ["Object", "MyObject"]});
        });

        test('suggests existing classes in class reference even if Class is uppercase', () => {
            expectCompletions("MyObject.uc", 4, 9, { include: ["Object", "MyObject"]});
        });

        test('suggests existing classes if name is only opened', () => {
            expectCompletions("MyObject.uc", 5, 9, { include: ["Object", "MyObject"]});
        });

        test('does not suggest clasnames after closing quote', () => {
            expectCompletions("MyObject.uc", 6, 18, { exclude: ["MyObject"]});
        });

    });

    describe("variable definition type completion", () => {
        
        beforeAll(() => {
            reset();
            ast("MyOther.uc", 1, ['class MyOther extends Actor;']);
            ast("MyClass.uc", 1, [
                'class MyClass extends MyOther;',
                'var ;', // 1
                'var My X;', //2
                'var', // 3
                'function Tick() {', // 4
                '   local ;', // 5
                '}',
            ]);
        });

        test("var type completion", () => expectCompletions("MyClass.uc", 1, 4, { 
            include: ["Actor", "MyOther", "MyClass"],
        }));

        test('var partial type completion', () => expectCompletions("MyClass.uc", 2, 6, {
            include: ["MyOther", "MyClass"],
            exclude: ["Actor"],
        }));

        test('local var type completion', () => expectCompletions("MyClass.uc", 5, 9, {
            include: ["Actor", "MyOther", "MyClass"],
        }));
    });

    describe("override completion", () => {

        beforeEach(reset);

        test('suggest override at root level', () => {
            ast("Mutator.uc", 1, ['class Mutator extends Object; function bool HandleEndGame();']);
            ast("MyMutator", 1, [ 'class MyMutator extends Mutator;']);
            expectCompletion("MyMutator", 1, 0, {
                label: "function bool Mutator.HandleEndGame()",
                text: "function bool HandleEndGame()\n{\n\treturn super.HandleEndGame();\n}\n",
            });
        });

        test('does not suggest override for final functions', () => {
            ast("A", 1, ['class A; final function Exit();']);
            ast("B", 1, [ 'class B extends A;']);
            expectCompletions("B", 1, 0, { excludePattern: /Exit/gi });
        });

        test('suggest override after existing function', () => {
            ast("A", 1, ['class A; function bool HandleEndGame();']);
            ast("B", 1, [ 'class B extends A; function Print(){}']);
            expectCompletions("B", 1, 0, { include: ['function bool A.HandleEndGame()'] });
        });

        test('does not suggest override if already overwritten', () => {
            ast("A", 1, ['class A; function bool HandleEndGame();']);
            ast("B", 1, [ 'class B extends A; function bool HandleEndGame(){}']);
            expectCompletions("B", 1, 0, { excludePattern: /HandleEndGame/gi });
        });


    });

    describe("const completion", () => {

        beforeAll(() => {
            reset();
            ast("MyOther.uc", 1, [
                'class MyOther extends Actor;',
                'const PI=3.14159',
            ]);
            ast("MyClass.uc", 1, [
                'class MyClass extends MyOther;',
                'const MYVALUE=4 ;', // 1
                'var int X;', //2
                '', // 3
                'function Tick() {', // 4
                '   X = ;', // 5
                '   X = self.;', //6
                '}',
            ]);
        });

        test('suggest class const in expression', () => {
            expectCompletion("MyClass.uc", 5, 7, "MYVALUE");
        });

        test('suggest inherited const in expression', () => {
            expectCompletion("MyClass.uc", 5, 7, "PI");
        });

        test('suggest const through self', () => {
            expectCompletion("MyClass.uc", 6, 12, "MYVALUE");
        });

        test('suggest inhertied const through self', () => {
            expectCompletion("MyClass.uc", 6, 12, "PI");
        });

    });

    const expectCompletions = (uri: string, line: number, pos: number, options: { 
        include?: Array<string|CompletionInformation>, 
        exclude?: Array<string|CompletionInformation>, 
        count?: number,
        excludePattern?: RegExp,
    }) => {
        const completions = db.findCompletions(uri, line, pos);
        if (options.include) {
            expect(completions).not.toHaveLength(0);
            for (let include of options.include) {
                if (typeof include === 'string') include = { label: include };
                let item = null;
                for (const completion of completions) {
                    item = completion;
                    if (completion.label === include.label) {
                        break;
                    }
                }
                expect(item).toMatchObject(include);
            }
        }
        if (options.exclude) {
            for (let exclude of options.exclude) {
                if (typeof exclude === 'string') exclude = { label: exclude };
                for (const completion of completions) {
                    if (completion.label === exclude.label) {
                        expect(completion).not.toMatchObject(exclude);
                    }
                }
            }
        }
        if (options.excludePattern) {
            for (const completion of completions) {
                expect(completion.label).not.toMatch(options.excludePattern);
            }
        }
        if (options?.count != null) {
            expect(completions).toHaveLength(options?.count);
        }
    };

    const expectCompletion = (uri: string, line: number, pos: number, expected: string|CompletionInformation) => {
        expectCompletions(uri, line, pos, { include: [expected] });
    };

    const expectCompletionCount = (uri: string, line: number, pos: number, count: number) => {
        expectCompletions(uri, line, pos, { count });
    };



});


describe("references", () => {
    
    describe("inside single file", () => {

        beforeAll(() => {
            reset();
            ast("MyClass.uc", 1, [
                'class MyClass extends MyOther;',
                '',
                'var MyOther VObj;',
                '',
                'function Test(MyOther PObj) {', // line 4
                '    local MyOther LObj;',
                '    local int i;',
                '    LObj = PObj;', // line 7
                '    VObj = PObj;',
                '    for ( i=i; i<10; i+=1 ) Log(i);',
                '}',
                '', // line 11
                '',
                '',
                'function Test2() {', // line 14
                '    local int i, j;',
                '    Log(i);',
                '}',
            ]);
        });

        test('function parameter references', () => {
            expectReferences('MyClass.uc', 4, 25, 'PObj', [
                ["MyClass.uc", 4, 22, 'PObj'],
                ["MyClass.uc", 7, 11, 'PObj'],
                ["MyClass.uc", 8, 11, 'PObj'],
            ]);
        });

        test('local variable references', () => {
            expectReferences('MyClass.uc', 5, 20, 'LObj', [
                ["MyClass.uc", 5, 18, 'LObj'],
                ["MyClass.uc", 7, 4, 'LObj'],
            ]);
        });

        describe('single letter variables', () => {
            const refs: [string, number, number, string][] = [
                ["MyClass.uc", 6, 14, 'i'],
                ["MyClass.uc", 9, 10, 'i'],
                ["MyClass.uc", 9, 12, 'i'],
                ["MyClass.uc", 9, 15, 'i'],
                ["MyClass.uc", 9, 21, 'i'],
                ["MyClass.uc", 9, 32, 'i'],
            ];

            test('works on first char', () => {
                expectReferences('MyClass.uc', 6, 14, 'i', refs);
            });

            test('works on space after last char', () => {
                expectReferences('MyClass.uc', 6, 15, 'i', refs);
            });

            test('works on first usage', () => {
                expectReferences('MyClass.uc', 9, 10, 'i', refs);
            });

            test('works on position right after usage', () => {
                expectReferences('MyClass.uc', 9, 10, 'i', refs);
            });

            test('works on fn arg usage', () => {
                expectReferences('MyClass.uc', 9, 32, 'i', refs);
            });

            test('works on right side of operator', () => {
                expectReferences('MyClass.uc', 9, 12, 'i', refs);
            });
        });

        test('reference works when multiple vars are declared in single statement', () => {
            expectReferences('MyClass.uc', 15, 14, 'i', [
                ["MyClass.uc", 15, 14, 'i'],
                ["MyClass.uc", 16, 8, 'i'],
            ]);
        });

    });
    
    describe("cross file references", () => {

        beforeAll(() => {
            reset();

            ast("Canvas.uc", 1, [
                'class Canvas extends Object;',
                '',
                'function Reset() {', // line 2
                '}',
            ]);
            
            ast("CustomHUD.uc", 1, [
                'class CustomHUD extends Object;',
                '',
                'struct PlayerStats {',
                '   var string Name;',
                '};', // line 4
                '',
                'var Canvas LastCanvas;',
                'var PlayerStats CurrentPlayerStats;', 
                '',
                'function Render(Canvas c) {', // line 9
                '   local PlayerStats temp;',
                '   c.Reset();',
                '}',
                '',
                'function Init() {', // line 14
                '   LastCanvas = new class\'Canvas\';',
                '}',
                '',
                'function RenderSpecial(SpecialCanvas c) {', // line 18
                '   if (c.bIsSpecial) {',
                '       Render(Canvas(c));',
                '   }',
                '}',
                '',
                'defaultproperties {', // line 24
                '   LastCanvas=None',
                '}',
            ]);

            ast("SpecialCanvas.uc", 1, [
                'class SpecialCanvas extends Canvas;',
                '',
                'var Class ParentClass;',
                '',
                'defaultproperties {', // line 4
                '   ParentClass=Class\'Canvas\'',
                '}',
            ]);
            
            ast("SpecialCustomHud.uc", 1, [
                'class SpecialCustomHud extends CustomHUD;',
                '',
                'function Reset() {', // line 2
                '   LastCanvas = None;',
                '   goto END;',
                'END:',
                '}',
            ]);

            ast("Utils.uc", 1, [
                'class Utils extends Object;',
                '',
                'static function ResetHudCanvas(CustomHUD hud) {',
                '   hud.LastCanvas = None;',
                '}'
            ]);

            ast("Unrelated.uc", 1, [
                'class Unrelated extends Unknown;',
                '',
                'var int LastCanvas;',
                '',
                'function Init(Unknown hud) {',
                '   LastCanvas = -1;',
                '   hud.LastCanvas = -1;',
                '}'
            ]);

        });

        test("method references", () => {
            expectReferences("Canvas.uc", 2, 11, 'Reset', [
                ["Canvas.uc", 2, 9, "Reset"], // declared
                ["CustomHUD.uc", 11, 5, "Reset"], // member call
            ]);
        });

        test("class references", () => {
            expectReferences("Canvas.uc", 0, 8, 'Canvas', [
                ["Canvas.uc", 0, 6, "Canvas"], // declaration
                ["CustomHUD.uc", 6, 4, "Canvas"], // used as var
                ["CustomHUD.uc", 9, 16, "Canvas"], // used as param
                ["CustomHUD.uc", 15, 25, "'Canvas'"], // class'Canvas'
                ["CustomHUD.uc", 20, 14, "Canvas"], // typecast
                ["SpecialCanvas.uc", 0, 28, "Canvas"], // extends
                ["SpecialCanvas.uc", 5, 20, "'Canvas'"], // defaultprops
            ]);
        });

        test("var references", () => {
            expectReferences("CustomHUD.uc", 6, 15, 'LastCanvas', [
                ["CustomHUD.uc", 6, 11, "LastCanvas"], // declaration
                ["CustomHUD.uc", 15, 3, "LastCanvas"], // assignemnt in expression
                ["CustomHUD.uc", 25, 3, "LastCanvas"], // defaultprop
                ["SpecialCustomHud.uc", 3, 3, "LastCanvas"], // inherited var
                ["Utils.uc", 3, 7, "LastCanvas"], // member access
            ]);
        });

        test("struct references", () => {
            expectReferences("CustomHUD.uc", 2, 7, 'PlayerStats', [
                ["CustomHUD.uc", 2, 7, "PlayerStats"], // symbol declared here
                ["CustomHUD.uc", 7, 4, "PlayerStats"], // used as var type
                ["CustomHUD.uc", 10, 9, "PlayerStats"], // used as local type
            ]);
        });

        test("label references", () => {
            expectReferences("SpecialCustomHud.uc", 4, 9, 'END', [
                ["SpecialCustomHud.uc", 5, 0, "END"], // symbol declared here
                ["SpecialCustomHud.uc", 4, 8, "END"], // forward reference
            ]);
        });

    });
    
    test("class bool var inside iff", () => {
        reset();
        ast("TestIfRef.uc", 1, [
            "class TestIfRef extends Object;",
            "",
            "var bool bEnabled;", //2
            "",
            "function TestIfRef(bool bThird) ", //4
            "{",
            "    local bool bSecond;",
            "    ",
            "    bSecond = True;",
            "    ",
            "    if ( bEnabled && bSecond && bThird ) ", // 10
            "        Log(\"Is enabled \"$bEnabled);", // 11
            "    ",
            "}",
        ]);
        expectReferences("TestIfRef.uc", 2, 13, "bEnabled", [
            ["TestIfRef.uc", 2, 9, "bEnabled"],
            ["TestIfRef.uc", 10, 9, "bEnabled"],
            ["TestIfRef.uc", 11, 26, "bEnabled"],
        ]);

    });

    function expectReferences(uri: string, line: number, char: number, symbol: string, refs: [string, number, number, string][]) {
        expect(db.findSymbolToken(uri, line, char).token?.text).toEqual(symbol);
        const result = db.findReferences(uri, line, char);
        expect(result.map(r => [r.uri, r.token?.line, r.token?.position, r.token?.text])).toEqual(refs);
    }

});

function reset() {
    db = new ClassDatabase();
}

function ast(uri: string, version: number, lines: string[]) {
    db.updateAst(uri, ucParseLines(lines), version);
}

function expectVersion(uri: string, expected: number) {
    expect(db.getVersion(uri)).toBe(expected);
}

// TODO
// hover information missing

// function ResetPawn(Pawn P) 
// {
// if ( P == None ) 
// 	return;

// if ( P.PlayerReplicationInfo.bIsSpectator ){ << here
		
// }