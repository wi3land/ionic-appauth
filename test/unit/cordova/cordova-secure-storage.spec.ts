import { expect } from 'chai';
import { CordovaSecureStorage } from '../../../src/cordova/cordova-secure-storage';
import { ImportMock } from 'ts-mock-imports';
import * as secureStorageModule from '@awesome-cordova-plugins/secure-storage';

const KEY: string = 'KEY';
const value: string = 'value';
//const mockManager = ImportMock.mockStaticClass(secureStorageModule, 'SecureStorage');


describe('cordova storage Tests', () => {
  it(`should do success creating storage`, async () => {
   // const storage: CordovaSecureStorage = new CordovaSecureStorage();
    // await storage.clear();
    //
  });
});
