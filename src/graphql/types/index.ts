import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';

const __dirname: string = path.dirname(fileURLToPath(import.meta.url));


export const initTypeDefinition = async (): Promise<string | any> => {
	const resolversArray: any[] = await loadFiles(__dirname, {
		extensions: ['ts', 'js'], // Specify file extensions to load
		ignoreIndex: true, // Ignore index files in the directory
		requireMethod: async (filePath: string) => {
			// Dynamically import each file as a module
			return import(pathToFileURL(filePath).href);
		},
	});

	// Merge and return the loaded type definitions
	return mergeTypeDefs(resolversArray);
};
