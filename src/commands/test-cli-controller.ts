import axios from 'axios';
import * as Sentry from '@sentry/node';

import BaseCommand from '../BaseCommand';
import { getUsername, getPassword } from '../utils/configGetters';
import apiUrl from '../utils/apiUrl';

export class TestCliController extends BaseCommand {
  static description = 'Test whether CLI Controller in app is working.';

  async run(): Promise<void> {
    const username = getUsername();
    const password = getPassword();

    try {
      const response = await axios.get(apiUrl('visual'), {
        auth: { username, password }
      });
      console.log(response.data);
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
    }
  }
}