import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import AuthenticatedCommand from '../authenticated-command';
import checkConfig from '../utils/check-config';
import checkSchema from '../utils/check-schema';
import { getRoot } from '../utils/config-getters';
import getDirectories from '../utils/get-directories';

export class Validate extends AuthenticatedCommand {
	static description = 'Validate the config and schema of all local templates';

	async run(): Promise<void> {
		const root: string = getRoot();
		const brandFolders: string[] = await getDirectories(root);
		const brands: string[] = brandFolders.filter((folder: string) => folder[0] !== '.');

		for (const brandIndex in brands) {
			const brand: string = brands[brandIndex];
			const visualFolders: string[] = await getDirectories(path.join(root, brand));
			const visuals: string[] = visualFolders.filter((folder: string) => folder[0] !== '.');

			for (const visualIndex in visuals) {
				const visual = visuals[visualIndex];
				const visualPath = path.join(root, brand, visual);

				await this.validate(visualPath, brand, visual);
			}
		}

		console.log(chalk.green('Done.'));
	}

	async validate(visualPath: string, brand: string, visual: string): Promise<void> {
		const configPath = path.join(visualPath, 'config.json');

		if (fs.existsSync(configPath)) {
			console.log(`Checking config of ${brand}/${visual}`);
			await checkConfig(configPath);
		}

		const schemaPath = path.join(visualPath, 'schema.json');

		if (fs.existsSync(schemaPath)) {
			console.log(`Checking schema of ${brand}/${visual}`);

			const state = {};

			await checkSchema(schemaPath, state);
		}
	}
}
