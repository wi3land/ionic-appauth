import { expect } from 'chai';
import { CapacitorSecureStorage } from '../../../src/capacitor/capacitor-secure-storage';
import { ImportMock } from 'ts-mock-imports';
import * as secureStorageModule from 'capacitor-secure-storage-plugin';

const KEY: string = 'KEY';
const value: string = 'value';
const mockManager = ImportMock.mockStaticClass(secureStorageModule, 'SecureStoragePlugin');

describe('capacitor secure storage Tests', () => {
  it(`should do success creating storage  and set value`, () => {
    const storage: CapacitorSecureStorage = new CapacitorSecureStorage();

    mockManager.mock('set').returns(new Promise(() => {}));

    storage.setItem(KEY, value).then(() => {});
  });

  it(`should do success creating storage and get value`, () => {
    const storage: CapacitorSecureStorage = new CapacitorSecureStorage();
    mockManager.mock('get', [KEY]).returns(
      new Promise((resolve, reject) => {
        resolve(value);
        reject(null);
      }),
    );
    storage.getItem(KEY).then((returnedValue) => {
      expect(returnedValue).to.be.equal(value);
    });
  });

  it(`should do success creating storage and remove value`, () => {
    const storage: CapacitorSecureStorage = new CapacitorSecureStorage();
    mockManager.mock('remove').returns(new Promise(() => {}));
    storage.removeItem(KEY).then(() => {});
  });
  it(`should do success creating storage and clear`, () => {
    const storage: CapacitorSecureStorage = new CapacitorSecureStorage();
    mockManager.mock('clear').returns(new Promise(() => {}));
    storage.clear().then(() => {});
  });
});
