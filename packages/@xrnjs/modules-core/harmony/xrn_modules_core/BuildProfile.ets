/**
 * Use these variables when you tailor your ArkTS code. They must be of the const type.
 */
export const HAR_VERSION = '1.0.0';
export const BUILD_MODE_NAME = 'debug';
export const DEBUG = true;
export const TARGET_NAME = 'default';
export const env_file_debug = '.env';
export const env_file_release = '.env';
export const env = 'dev';
export const ServerUrl = '';
export const commonHash = '';

/**
 * BuildProfile Class is used only for compatibility purposes.
 */
export default class BuildProfile { 
	static readonly HAR_VERSION = HAR_VERSION;
	static readonly BUILD_MODE_NAME = BUILD_MODE_NAME;
	static readonly DEBUG = DEBUG;
	static readonly TARGET_NAME = TARGET_NAME;
	static readonly env_file_debug = env_file_debug;
	static readonly env_file_release = env_file_release;
	static readonly env = env;
	static readonly ServerUrl = ServerUrl;
	static readonly commonHash = commonHash;
}