import { parseCliArgs as parse } from "./parseCliArgs";
import { UcxCommand } from "./UcxCommand";

test('empty args return empty object', () => {
    expect(parse([])).toMatchObject({});
});

test('parsed interpreter and script', () => {
    expect(parse(['node', 'ucx.js'])).toMatchObject({
        jsInterpreter: 'node',
        ucxScript: 'ucx.js'
    } as Partial<UcxCommand>);
});

test('parsed files', () => {
    expect(parse(['','','build','../Project'])).toMatchObject({
        files: ['../Project']
    } as Partial<UcxCommand>);
});

test('parsed command', () => {
    expect(parse(['','','build'])).toMatchObject({
        command: 'build',
    } as Partial<UcxCommand>);
});

test('parsed ucc path', () => {
    expect(parse(['','','build', '--ucc', '../System/ucc.exe','../Project'])).toMatchObject({
        uccPath:'../System/ucc.exe',
        files: ['../Project']
    } as Partial<UcxCommand>);
});

test('unsupported args reported as errors', () => {
    expect(parse(['','','','--unknown'])).toMatchObject({
        errors: ['Unknown argument "--unknown"']
    } as Partial<UcxCommand>);
});

test('parse pass command to ucc', () => {
    expect(parse(['','','ucc','help','--ini=test.ini'])).toMatchObject({
        command: 'ucc',
        files: ['help', '--ini=test.ini'],
    } as Partial<UcxCommand>);
});

test('can have ucx args before command', () => {
    expect(parse(['','', '--ucc', '../System/ucc.exe', 'ucc','help','--ini=test.ini'])).toMatchObject({
        command: 'ucc',
        uccPath: '../System/ucc.exe',
        files: ['help', '--ini=test.ini'],
    } as Partial<UcxCommand>);
});

test('parse pass command to ut', () => {
    expect(parse(['','','ut','help','--ini=test.ini'])).toMatchObject({
        command: 'ut',
        files: ['help', '--ini=test.ini'],
    } as Partial<UcxCommand>);
});

test('parse pass command to ue (unrealed)', () => {
    expect(parse(['','','ue','help', '--ini=test.ini'])).toMatchObject({
        command: 'ue',
        files: ['help', '--ini=test.ini'],
    } as Partial<UcxCommand>);
});

test('parsed build command with --no-clean', () => {
    expect(parse(['','','build', '--no-clean', '../Project'])).toMatchObject({
        files: ['../Project'],
        noClean: true
    } as Partial<UcxCommand>);
});
