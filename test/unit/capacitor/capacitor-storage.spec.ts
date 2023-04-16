import { expect } from 'chai';
import { CapacitorStorage } from '../../../src/capacitor/capacitor-storage';

const KEY: string = 'KEY';
const value: string = 'value';

describe('capacitor storage Tests', () => {
  it(`should do success creating storage`, async () => {
    const storage: CapacitorStorage = new CapacitorStorage();
    // await storage.setItem(KEY, value);
  });
});
