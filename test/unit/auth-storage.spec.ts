import { expect } from 'chai';
import { IonicStorage } from '../../src/auth-storage';

const KEY: string = 'KEY';
const value: string = 'value';

describe('auth storage Tests', () => {
  it(`should do success init Ionic storage and clear`, async () => {
    const storage: IonicStorage = new IonicStorage();
    await storage.clear();
  });

  it(`should do success init Ionic storage and remove value`, async () => {
    const storage: IonicStorage = new IonicStorage();
    await storage.removeItem(KEY);
    const valueReturned: string | null = await storage.getItem(KEY);
    expect(valueReturned).to.be.null;
  });

  it(`should do success init Ionic storage and remove and set values`, async () => {
    const storage: IonicStorage = new IonicStorage();
    let valueReturned: string | null = await storage.getItem(KEY);
    expect(valueReturned).to.be.null;
    await storage.setItem(KEY, value);
    await storage.clear();
    valueReturned = await storage.getItem(KEY);
    expect(valueReturned).to.be.null;
    await storage.setItem(KEY, 'value2');
    valueReturned = await storage.getItem(KEY);
    expect(valueReturned).not.to.equal(value);
  });
});
