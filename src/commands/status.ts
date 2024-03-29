import * as Sentry from '@sentry/node';
import chalk from 'chalk';
import Table from 'cli-table';
import * as fs from 'node:fs';
import path from 'node:path';
import simpleGit from 'simple-git';

import AuthenticatedCommand from '../authenticated-command';
import { getGitConfig, getGitOrigin, getRoot } from '../utils/config-getters';
import getDirectories from '../utils/get-directories';

export class Status extends AuthenticatedCommand {
	static description = 'Git status of all local templates';

	async run(): Promise<void> {
		const { flags } = await this.parse(Status);
		const { debug } = flags;

		const root = getRoot();
		const git = simpleGit(getGitConfig());
		const brandFolders = await getDirectories(root);
		const brands = brandFolders.filter((folder: string) => folder[0] !== '.');
		const table = new Table({
			head: ['Brand', 'Template', 'Git Branch', 'Status'],
		});

		let tableContainsRows = false;

		for (const brandIndex in brands) {
			if (!brands[brandIndex]) {
				continue;
			}

			const brand = brands[brandIndex];
			const visualFolders = await getDirectories(path.join(root, brand));

			const visuals = visualFolders.filter((folder) => folder[0] !== '.');

			for (const visualIndex in visuals) {
				if (!visuals[visualIndex]) {
					continue;
				}

				const visual = visuals[visualIndex];
				const visualPath = path.join(root, brand, visual);

				const visualFiles = await fs.promises.readdir(visualPath, { withFileTypes: true });

				if (visualFiles.length === 0) {
					table.push([brand, visual, 'Empty folder, deleting']);
					tableContainsRows = true;
					await fs.promises.rmdir(visualPath);
					continue;
				}

				if (!fs.existsSync(path.join(visualPath, '.git'))) {
					table.push([brand, visual, 'Git not initialized']);
					tableContainsRows = true;
					continue;
				}

				try {
					await git.cwd(visualPath);
					await git.removeRemote('origin');

					const origin = getGitOrigin(brand, visual);

					await git.addRemote('origin', origin);

					const status = await git.status();

					if (status.files.length > 0) {
						const fileNames = status.files.map((file) => file.path).join(', ');
						const currentBranch = status.current === 'master' ? status.current : chalk.yellow(`${status.current} (not on master)`);

						table.push([brand, visual, currentBranch, `Changed ${status.files.length} files: ${fileNames}`]);
						tableContainsRows = true;
					}
				} catch (error: any) {
					Sentry.captureException(error);

					if (debug) {
						this.reportError(error);
					}

					table.push([brand, visual, `Error: ${error.toString()}`]);
					tableContainsRows = true;
				}
			}
		}

		if (tableContainsRows) {
			console.log(table.toString());
		} else {
			console.log(chalk.green('No changes ✅️'));
		}
	}
}
