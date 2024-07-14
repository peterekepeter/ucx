export interface LintResult {
    line?: number;
    position?: number;
    length?: number;
    message?: string;
    originalText?: string;
    fixedText?: string;
    source?: 'parser' | 'linter';
    severity?: 'warning' | 'error';
    deprecated?: boolean;
    unnecessary?: boolean;
}
