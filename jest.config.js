/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    transform: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "^.+\\.tsx?$": "jest-esbuild"
    },
    testEnvironment: 'node',
    rootDir: './src/lib',
    coverageProvider: 'v8',
};