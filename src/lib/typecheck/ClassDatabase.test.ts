import { ucParseLines } from "../parser/ucParse";
import { ClassDatabase, TokenInformation } from "./ClassDatabase";
import { renderDefinitionMarkdownLines } from "./renderDefinitonMarkdownLines";

let db: ClassDatabase;

beforeEach(() => db = new ClassDatabase());

describe("ast versioning", () => {

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

describe("single file", () => {

    const uri = "SomeClass.uc";

    beforeEach(() => {
        ast(uri, 1, [
            'class SomeClass extends Info;', // line 0
            '',
            'var config string tag;',
            '', // line 3
            'function PostBeginPlay(string name) {', // line 4
            '    local int i;',
            '    for (i=0; i<10; i+=1) Log(tag$name);', // line 6
            '    DebugPrint();', // line 7
            '}',
            '',
            'function DebugPrint() {', // line 10
            '    Log(tag);',
            '}',
        ]);
    });

    test('searching in another file resutls in missing ast', () => {
        expect(db.findToken('asdasdas', 0, 0).missingAst).toBe(true);
    });
    
    // find token
    test.each([
        [0, 1, { found: true }],
        [0, 100, { found: false }],
        [0, 1, { token: { text: 'class' } }],
        [0, 6, { token: { text: 'SomeClass' } }],
        [4, 32, { 
            token: {text: 'name'}, 
            functionScope: { name: { text: 'PostBeginPlay' }},
            uri: uri,
            ast: {},
        }],
        [6, 9, { 
            token: { text: 'i' }, 
            functionScope: { name: { text: 'PostBeginPlay' }},
        }] as [number, number, TokenInformation],
    ])("findToken at (%p:%p) results %p", (line, column, expected) => {
        expect(db.findToken(uri, line, column)).toMatchObject(expected);
    });

    // find definition
    test.each([
        [6, 9, { 
            token: { text: 'i', line: 5 }, 
            localDefinition: { type: { text: 'int' }},
        }],
        [7, 9, { 
            token: { text: 'DebugPrint' }, 
            fnDefinition: { name: { text: 'DebugPrint' }},
        }] as [number, number, TokenInformation],
    ] as [number, number, TokenInformation][]
    )("findLocalDefinition at (%p:%p) results %p", (line, column, expected) => {
        const token = db.findToken(uri, line, column);
        const definition = db.findLocalFileDefinition(token);
        expect(definition).toMatchObject(expected);
    });

    // markdown definition
    test.each([
        [6, 9, ['\tlocal int i']],
        [6, 35, ['\t(parameter) string name']],
        [6, 31, ['\tvar config string tag']],
        [7, 9, ['\tfunction DebugPrint()']],
        [0, 9, ['\tclass SomeClass extends Info']],
    ] as [number, number, string[]][]
    )("markdown definition at (%p:%p) is %p", (line, column, expected) => {
        const info = db.findLocalFileDefinition(db.findToken(uri, line, column));
        expect(renderDefinitionMarkdownLines(info)).toEqual(expected);
    });

});

describe("cross file", () => {

    const uriA = "ClassA.uc";
    const uriB = "ClassB.uc";

    beforeEach(() => {
        ast(uriA, 1, [
            'class ClassA;', // line 0
            '',
            'var int Count;',
        ]);
        ast(uriA, 1, [
            'class ClassA;', // line 0
            '',
            'var int Count;',
        ]);
        ast(uriB, 1, [
            'class ClassB extends ClassA;', // line 0
            '',
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
        ]);
    });

    const classDefA = { token: { text: 'ClassA' }, uri: uriA };
    const varDefCount = { uri: uriA, varDefinition: { name: { text: 'Count' }} };

    // find definition
    test.each([
        ['parent type', 0, 24, classDefA],
        ['inherited variable', 5, 4, varDefCount],
        ['var type', 2, 7, classDefA],
        ['return type', 8, 13, classDefA], 
        ['parameter type', 8, 28, classDefA],
        ['local type', 9, 12, classDefA],
        ['absolute class reference', 10, 23, classDefA],
    ] as [string, number, number, TokenInformation][]
    )("findCrossFileDefinition finds %p at %p:%p", (_, line, column, expected) => {
        const token = db.findToken(uriB, line, column);
        const definition = db.findCrossFileDefinition(token);
        expect(definition).toMatchObject(expected);
    });

});

function ast(uri: string, version: number, lines: string[]) {
    db.updateAst(uri, ucParseLines(lines), version);
}

function expectVersion(uri: string, expected: number) {
    expect(db.getVersion(uri)).toBe(expected);
}