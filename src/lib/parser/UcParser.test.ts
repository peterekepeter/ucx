import { UcParser } from "./UcParser";
import { ucTokenizeLine } from "../tokenizer/ucTokenizeLine";


test("parse basic class declration", () => { 
    parsing(`class Util expands Info;`)
        .hasClassName('Util')
        .hasParentClassName('Info')
        .isAbstract(false)
        .isNative(false)
        .hasNativeReplication(false)
        .hasNoErrors();
});

test("parse class declaration with extra decorators", () => { parsing(`
    class Actor extends Object
        abstract
        native
        nativereplication;
    `)
    .hasClassName('Actor')
    .hasParentClassName('Object')
    .isAbstract(true)
    .isNative(true)
    .hasNativeReplication(true)
    .hasNoErrors();
});

test("parse variable declaration", () => { parsing(`
    var bool bDynamicLight;
    `)
    .hasVariable(0, 'bool', 'bDynamicLight', { const: false, transient: false })
    .hasNoErrors();
});

test("parse variable declaration with decorators", () => { parsing(`
    var transient const bool bTicked;
    `)
    .hasVariable(0, 'bool', 'bTicked', { const: true, transient: true })
    .hasNoErrors();
});

test("parse config var", () => { parsing(`
    var config string Description;
    `)
    .hasVariable(0, "string", "Description", { config: true });
});

test("parse variable declaration with group", () => { parsing(`
    var(Advanced) bool		bAlwaysRelevant;
    `)
    .hasVariable(0, 'bool', 'bAlwaysRelevant', { group: 'Advanced' })
    .hasNoErrors();
});

test("parse enum declaration", () => { parsing(`
    enum ENetRole
    {
        ROLE_None,              // No role at all.
        ROLE_DumbProxy,			// Dumb proxy of this actor.
        ROLE_SimulatedProxy,	// Locally simulated proxy of this actor.
        ROLE_AutonomousProxy,	// Locally autonomous proxy of this actor.
        ROLE_Authority,			// Authoritative control over the actor.
    };`)
    .hasEnum(0, 'ENetRole', 0, 'ROLE_None')
    .hasEnum(0, 'ENetRole', 1, 'ROLE_DumbProxy')
    .hasEnum(0, 'ENetRole', 2, 'ROLE_SimulatedProxy')
    .hasEnum(0, 'ENetRole', 3, 'ROLE_AutonomousProxy')
    .hasEnum(0, 'ENetRole', 4, 'ROLE_Authority')
    .hasNoErrors();
});

test("parse variable declaration with group", () => { parsing(`
    var(Advanced) bool		bAlwaysRelevant;
    `)
    .hasVariable(0, 'bool', 'bAlwaysRelevant', { group: 'Advanced' })
    .hasNoErrors();
});

test("keyword still works even if wrongly cased", () => { parsing(`
    CONST MAX_ITEMS = 32;
    VAR int thing;
    `)
    .hasNoErrors();
});

test("parse variable declaration with group", () => { parsing(`
    const MAX_ITEMS = 32;
    `)
    .hasConstant(0, {
        name: 'MAX_ITEMS',
        value: '32'
    })
    .hasNoErrors();
});

function parsing(input: string) {
    const parser = new UcParser();
    const lines = input.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    const ast = parser.getAst();

    const checks = {
        hasClassName: (name: string) => checkEquals(name, ast.name?.text),
        hasParentClassName: (name: string) => checkEquals(name, ast.parentName?.text),
        hasNoErrors: () => checkEmpty(ast.errors),
        isAbstract: (flag: boolean) => checkEquals(flag, ast.isAbstract, "isAbstract should be " + flag),
        isNative: (flag: boolean) => checkEquals(flag, ast.isNative, "isNative should be " + flag),
        hasNativeReplication: (flag: boolean) => checkEquals(flag, ast.isNativeReplication, "hasNativeReplication should be " + flag),
        hasVariable: (index: number, type: string, name: string, props?: { transient?: boolean, const?: boolean, group?: string, config?: boolean }) => {
            checkEquals(ast.variables[index]?.type?.text, type);
            checkEquals(ast.variables[index]?.name?.text, name);
            if (props?.transient != null) {
                checkEquals(ast.variables[index]?.isTransient, props.transient);
            }
            if (props?.const != null) {
                checkEquals(ast.variables[index]?.isConst, props.const);
            }
            if (props?.group != null) {
                checkEquals(ast.variables[index]?.group?.text, props.group);
            }
            if (props?.config != null) {
                checkEquals(ast.variables[index]?.isConfig, props.config);
            } 
            return checks;
        },
        hasEnum: (index: number, name: string, enumIndex: number, enumName: string) => {
            checkEquals(ast.enums[index].name?.text, name);
            checkEquals(ast.enums[index].enumeration[enumIndex].text, enumName);
            return checks;
        },
        hasConstant(index: number, props: { name?:string, value?:string }){
            const obj = ast.constants[index];
            checkMatches({ 
                name: obj?.name?.text, 
                value: obj?.value?.text 
            }, props);
            return checks;
        }
    };
    return checks;

    function checkEquals(a: any, b: any, message?: string) {
        expect(a).toBe(b);
        return checks;
    }

    function checkEmpty(container: any) {
        expect(container).toEqual([]);
        return checks;
    }

    function checkMatches(actual: object, expected: object){
        expect(actual).toMatchObject(expected);
        return checks;
    }
}
