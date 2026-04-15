import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
	projects: [
		{
			displayName: 'engine',
			transform: { ...tsJestTransformCfg },
		},
		{
			displayName: 'server',
			transform: { ...tsJestTransformCfg },
		},
	],
};
