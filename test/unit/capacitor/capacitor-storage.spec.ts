import { expect } from 'chai';
import { CapacitorStorage } from '../../../src/capacitor/capacitor-storage';
import { ImportMock } from 'ts-mock-imports';
import * as preferencesModule from '@capacitor/preferences';

const KEY: string = 'KEY';
const value: string = 'value';
const mockManager = ImportMock.mockStaticClass(preferencesModule, 'Preferences');

describe('capacitor storage Tests', () => {
  it(`should do success creating storage, set, get, remove item and clear`, async () => {
    const storage: CapacitorStorage = new CapacitorStorage();

    mockManager.mock('set');
    mockManager.mock('get', [KEY]).returns({
      value,
    });
    mockManager.mock('remove');
    mockManager.mock('clear');
    await storage.setItem(KEY, value);
    const returnedValue = await storage.getItem(KEY);
    expect(returnedValue).to.be.equal(value);
    await storage.removeItem(KEY);
    await storage.clear();
  });
});
