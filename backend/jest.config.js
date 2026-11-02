/** @type {import('jest').Config} */
module.exports = {
    rootDir: ".",
    testEnvironment: "node",

    roots: ["<rootDir>/tests"],

    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

    testMatch: [
        "**/*.test.ts",
        "**/*.spec.ts"
    ],

    transform: {
        "^.+\\.tsx?$": [
            "@swc/jest",
            {
                jsc: {
                    parser: {
                        syntax: "typescript",
                        tsx: false
                    },
                    target: "es2022"
                },
                module: {
                    type: "commonjs"
                }
            }
        ]
    },

    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },

    moduleFileExtensions: [
        "ts",
        "js",
        "json"
    ],

    clearMocks: true,
    restoreMocks: true,

    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/server.ts",
        "!src/**/*.d.ts"
    ],

    coverageDirectory: "coverage",

    coverageReporters: [
        "text",
        "lcov"
    ],

    testTimeout: 15000
};