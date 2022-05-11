import path from 'path';
import fs from 'fs';
import simpleGit from 'simple-git';
import Listr, { ListrTask } from 'listr';
import { Flags } from '@oclif/core';

import AuthenticatedCommand from '../AuthenticatedCommand';
import getDirectories from '../utils/getDirectories';
import { getRoot } from '../utils/configGetters';

export class Pull extends AuthenticatedCommand {
	static description = 'Pull all local visuals';

	static flags = {
		debug: Flags.boolean({ char: 'd', description: 'Debug mode', required: false, default: false }),
	}

	async run(): Promise<void> {
		const { flags } = await this.parse(Pull);
		const { debug } = flags;

		const tasks: ListrTask[] = [];
		const root: string = getRoot();
		const brandFolders: string[] = await getDirectories(path.join(root, 'src'));
		const brands: string[] = brandFolders.filter((folder: string) => folder[0] !== '.');

		for (let brandIndex in brands) {
			if (!brands.hasOwnProperty(brandIndex)) {
				continue;
			}

			const brand: string = brands[brandIndex];
			const visualFolders: string[] = await getDirectories(path.join(root, 'src', brand));

			const visuals: string[] = visualFolders.filter((folder: string) => {
				return folder[0] !== '.';
			});

			for (let visualIndex in visuals) {
				if (!visuals.hasOwnProperty(visualIndex)) {
					continue;
				}

				const visual = visuals[visualIndex];
				const visualPath = path.join(root, 'src', brand, visual);

				tasks.push({
					title: `Fetching & pulling ${visualPath}`,
					task: async () => await this.fetchAndPull(visualPath),
				})
			}
		}

		const runner = new Listr(tasks, {
			concurrent: true,
			exitOnError: false,
			renderer: debug ? 'verbose' : 'default'
		});

		try {
			await runner.run();
		} catch (error) {
			// do nothing (this is here to silence ugly errors thrown into the console, listr prints errors in a pretty way)
		}
	}

	async fetchAndPull(visualPath: string): Promise<void> {
		const git = simpleGit();

		if (!fs.existsSync(path.join(visualPath, '.git'))) {
			return;
		}

		await git.cwd(visualPath);
		await git.fetch();
		await git.pull();
	}
}
