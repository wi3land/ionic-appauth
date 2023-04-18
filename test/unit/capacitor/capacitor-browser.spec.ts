import { expect } from 'chai';
import { CapacitorBrowser } from '../../../src/capacitor/capacitor-browser';
import { ImportMock } from 'ts-mock-imports';
import * as browserModule from '@capacitor/browser';
import * as capacitorModule from '@capacitor/core';

const mockBrowserManager = ImportMock.mockStaticClass(browserModule, 'Browser');
const mockCapacitorManager = ImportMock.mockStaticClass(capacitorModule, 'Capacitor');

describe('capacitor browser Tests', () => {
  it(`should do success creating browser, show and close window`, async () => {
    const browser: CapacitorBrowser = new CapacitorBrowser();

    mockBrowserManager.mock('open');
    mockBrowserManager.mock('close');
    mockBrowserManager.mock('addListener');
    await browser.showWindow('exampleUrl');
    await browser.closeWindow();
  });
});
