import chalk from 'chalk';

import BaseCommand from './BaseCommand';
import accountsUrl from './utils/accountsUrl';
import { setUser } from './utils/configGetters';

export default abstract class AuthenticatedCommand extends BaseCommand {
	async init(): Promise<void> {
		await super.init();

		try {
			const { data: user } = await this.performRequest({
				url: accountsUrl('user'),
				method: 'GET',
			});

			setUser(user);
		} catch (error: any) {
			// ToDo: attempt to refresh token
			console.log(chalk.red(error.message));
			return await this.exitHandler(1);
		}
	}
};