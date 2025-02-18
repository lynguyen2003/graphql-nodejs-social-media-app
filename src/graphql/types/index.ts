import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';

// Convert the module URL to a file path and get the directory name
const __dirname: string = path.dirname(fileURLToPath(import.meta.url));

/**
 * Initializes and merges GraphQL type definitions from files in the current directory.
 *
 * @returns {Promise<string | any>} A promise that resolves to the merged type definitions.
 */

export const initTypeDefinition = async (): Promise<string | any> => {
	// Load resolver files from the directory with specified extensions
	const resolversArray: any[] = await loadFiles(__dirname, {
		extensions: ['ts'], // Specify file extensions to load
		ignoreIndex: true, // Ignore index files in the directory
		requireMethod: async (filePath: string) => {
			// Dynamically import each file as a module
			return import(pathToFileURL(filePath).href);
		},
	});

	// Merge and return the loaded type definitions
	return mergeTypeDefs(resolversArray);
};
