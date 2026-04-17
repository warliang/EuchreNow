import { createDefaultEsmPreset } from 'ts-jest';

const sharedConfig = {
	...createDefaultEsmPreset(),
	testEnvironment: 'node',
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	clearMocks: true, // reset mock state between tests
};

/** @type {import("jest").Config} **/
export default {
	coverageProvider: 'v8',
	collectCoverageFrom: [
		'packages/**/src/**/*.ts',
		'apps/server/src/**/*.ts',
		'!**/*.d.ts', // ignore type declaration files
		'!**/index.ts', // ignore barrel files (just exports)
	],
	coverageThreshold: {
		global: {
			lines: 80,
		},
	},
	projects: [
		{
			displayName: 'engine',
			roots: ['<rootDir>/packages/engine'],
			...sharedConfig,
		},
		{
			displayName: 'server',
			roots: ['<rootDir>/apps/server'],
			...sharedConfig,
		},
	],
};
