export class CordovaDocument {
  static ready(f) {
    return new Promise((resolve) => {
      document.addEventListener('deviceready', () => {
        if (f != undefined) {
          f();
        }
        resolve();
      });
    });
  }
}
