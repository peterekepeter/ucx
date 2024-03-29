export interface LintResult {
    line?: number;
    position?: number;
    length?: number;
    message?: string;
    originalText?: string;
    fixedText?: string;
    severity?: 'warning' | 'error';
    source?: 'parser' | 'linter';
}
