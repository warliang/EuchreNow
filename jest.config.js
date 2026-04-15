import { createDefaultEsmPreset } from 'ts-jest';

/** @type {import("jest").Config} **/
export default {
	projects: [
		{
			displayName: 'engine',
			roots: ['<rootDir>/packages/engine'],
			...createDefaultEsmPreset(),
			testEnvironment: 'node',
			moduleNameMapper: {
				'^(\\.{1,2}/.*)\\.js$': '$1',
			},
		},
		{
			displayName: 'server',
			roots: ['<rootDir>/apps/server'],
			...createDefaultEsmPreset(),
			testEnvironment: 'node',
			moduleNameMapper: {
				'^(\\.{1,2}/.*)\\.js$': '$1',
			},
		},
	],
};
