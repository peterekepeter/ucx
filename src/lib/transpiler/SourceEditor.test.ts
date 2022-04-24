import { SourceEditor } from "./SourceEditor";


test("insert character", () =>{
    const editor = create("var x = 4;");
    editor.insert(0,4,'_');
    expect(editor.result).toBe("var _x = 4;");
});

test("insert variable", () => {
    const editor = create("var x = 9;");
    editor.insert(0,4,'i,');
    expect(editor.result).toBe("var i,x = 9;");
});

test('remove variable', () => {
    const editor = create("var i,j,k,l;");
    editor.remove(0,7,4);
    expect(editor.result).toBe("var i,j;");
});

test('insert on second line', () => {
    const editor = create("var i;\ni=0;");
    editor.insert(1,0, '//');
    expect(editor.result).toBe("var i;\n//i=0;");
});

test('maintains crlf', () => {
    const editor = create("var i;\r\ni=0;");
    expect(editor.result).toBe("var i;\r\ni=0;");
});

test('resolves order of edit' , () => {
    const editor = create("var i,j;");
    editor.replace(0,4,1,"index");
    editor.replace(0,6,1,"count");
    expect(editor.result).toBe("var index,count;");
});

function create(text: string) {
    return new SourceEditor(text);
}