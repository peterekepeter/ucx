import assert = require("assert");
import { UcParser, UnrealClass } from "./UcParser";
import { ucTokenizeLine } from "./ucTokenize";


test("parse basic class declration",
    () => parse(`class Util expands Info;`)
        .hasClassName('Util')
        .hasParentClassName('Info')
        .isAbstract(false)
        .isNative(false)
        .hasNativeReplication(false)
        .hasNoErrors()
);

test("parse class declaration with extra decorators", () => parse(`
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
    .hasNoErrors()
);

test("parse variable declaration", () => parse(`
    var bool bDynamicLight;
    `)
    .hasVariable(0, 'bool', 'bDynamicLight', { const: false, transient: false })
    .hasNoErrors()
);

test("parse variable declaration with decorators", () => parse(`
    var transient const bool bTicked;
    `)
    .hasVariable(0, 'bool', 'bTicked', { const: true, transient: true })
    .hasNoErrors()
);

test("parse variable declaration with group", () => parse(`
    var(Advanced) bool		bAlwaysRelevant;
    `)
    .hasVariable(0, 'bool', 'bAlwaysRelevant', { group: 'Advanced' })
    .hasNoErrors()
);

test("parse enum delcaration", () => parse(`
    enum ENetRole
    {
        ROLE_None,              // No role at all.
        ROLE_DumbProxy,			// Dumb proxy of this actor.
        ROLE_SimulatedProxy,	// Locally simulated proxy of this actor.
        ROLE_AutonomousProxy,	// Locally autonomous proxy of this actor.
        ROLE_Authority,			// Authoritative control over the actor.
    };`)
    .hasNoErrors()
);

function parse(input: string) {
    const parser = new UcParser();
    const lines = input.split(/\r\n/);
    for (let i = 0; i < lines.length; i++) {

        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse({ ...token, line: i });
        }
    }
    parser.endOfFile({ text: '', position: 0, line: lines.length });
    const ast = parser.getAst();

    const checks = {
        hasClassName: (name: string) => checkEquals(name, ast.name?.text),
        hasParentClassName: (name: string) => checkEquals(name, ast.parentName?.text),
        hasNoErrors: () => checkEmpty(ast.errors),
        isAbstract: (flag: boolean) => checkEquals(flag, ast.isAbstract, "isAbstract should be " + flag),
        isNative: (flag: boolean) => checkEquals(flag, ast.isNative, "isNative should be " + flag),
        hasNativeReplication: (flag: boolean) => checkEquals(flag, ast.isNativeReplication, "hasNativeReplication should be " + flag),
        hasVariable: (index: number, type: string, name: string, props?: { transient?: boolean, const?: boolean, group?: string }) => {
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
            return checks;
        }
    };
    return checks;

    function checkEquals(a: any, b: any, message?: string) {
        assert.strictEqual(a, b, message);
        return checks;
    }

    function checkEmpty(container: any) {
        assert.deepStrictEqual(container, []);
        return checks;
    }
}
