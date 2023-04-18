import { DefaultBrowser } from '../../src/auth-browser';

const URL: string = 'url';
class MockWindow {
  addEventListener(event: string, action: Function): void {}
}

function instanceGlobalWinMock(mockWin: boolean): void {
  let returnedWin: MockWindow | null = null;
  if (mockWin) returnedWin = new MockWindow();

  const MockBrowser = require('mock-browser').mocks.MockBrowser;
  const win = new MockBrowser().getWindow();
  win.open = (url: string, mode: string) => {
    return returnedWin;
  };
  global.window = win;
}

describe('auth browser Tests', () => {
  it(`should do success on close browser event`, async () => {
    const browser: DefaultBrowser = new DefaultBrowser();
    browser.browserCloseListener(() => {});
  });

  it(`should do success show window with listener`, () => {
    const browser: DefaultBrowser = new DefaultBrowser();
    const windowRef = global.window;
    instanceGlobalWinMock(true);
    browser.showWindow(URL);
    global.window = windowRef;
  });

  it(`should do success show window without listener`, () => {
    const browser: DefaultBrowser = new DefaultBrowser();
    const windowRef = global.window;
    instanceGlobalWinMock(false);
    browser.showWindow(URL);
    global.window = windowRef;
  });
});
