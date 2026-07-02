import { EventEmitter } from 'node:events';
import { emailEnum } from '../../enum/email.enum';

export const eventEmitter = new EventEmitter();

type EmailEventCallback = () => Promise<void> | void;

Object.values(emailEnum).forEach((eventName) => {
  eventEmitter.on(eventName, (fn: EmailEventCallback) => {
    void Promise.resolve(fn()).catch((error: unknown) => {
      console.error('Email event failed', error);
    });
  });
});
