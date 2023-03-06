
export function bold(input: string): string 
{
    return decorate(input, BOLD);
}

export function red(input: string): string 
{
    return decorate(input, RED);
}

export function green(input: string): string 
{
    return decorate(input, GREEN);
}

export function yellow(input: string): string 
{
    return decorate(input, YELLOW);
}

export function blue(input: string): string 
{
    return decorate(input, BLUE);
}

export function magenta(input: string): string 
{
    return decorate(input, MAGENTA);
}

export function cyan(input: string): string 
{
    return decorate(input, CYAN);
}

export function gray(input: string): string 
{
    return decorate(input, WHITE);
}

function decorate(input: string, style: string): string
{
    return `${style}${input}${RESET}`;
}

const BEGIN = '\x1b[';
const END = 'm';
const BOLD = escapeCode(1);
const RED = escapeCode(31);
const GREEN = escapeCode(32);
const YELLOW = escapeCode(33);
const BLUE = escapeCode(34);
const MAGENTA = escapeCode(35);
const CYAN = escapeCode(36);
const WHITE = escapeCode(37);
const RESET = escapeCode(0);

function escapeCode(code: number): string 
{
    return `${BEGIN}${code}${END}`;
}