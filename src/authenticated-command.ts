import chalk from 'chalk';
import * as inquirer from 'inquirer';

import BaseCommand from './base-command';
import { User } from './types/authenticated-command';
import accountsUrl from './utils/accounts-url';
import { getAccessToken, isLocal, setUser } from './utils/config-getters';
import { performLogin } from './utils/perform-login';

export default abstract class AuthenticatedCommand extends BaseCommand {
	protected user: User | null = null;

	async init(): Promise<void> {
		// Call BaseCommand initializer
		await super.init();

		// Validate, whether login command was run
		await this.wasLoginCommandRun();

		try {
			const { data: user } = await this.performRequest({
				method: 'GET',
				url: accountsUrl('user'),
			});

			this.user = user as User;

			setUser(this.user);
		} catch {
			await this.promptLogin(chalk.red(`Invalid user. You need to re-run "${this.config.bin} login". Do you wish to run this command now?`));
		}
	}

	private async promptLogin(message: string): Promise<void> {
		const shouldRunLoginCommand = await inquirer.prompt({
			default: true,
			message,
			name: 'answer',
			type: 'confirm',
		});

		if (!shouldRunLoginCommand.answer) {
			console.log(chalk.blue(`Take your time! When you're ready, just call the "${this.config.bin} login" command.`));
			return this.exitHandler(1);
		}

		await performLogin({ local: isLocal() });
	}

	private async wasLoginCommandRun(): Promise<void> {
		if (this.id === 'login' || getAccessToken() !== null) {
			return;
		}

		await this.promptLogin(chalk.yellow(`Before running an authenticated command, you need to run "${this.config.bin} login". Do you wish to run this command now?`));
	}
}
