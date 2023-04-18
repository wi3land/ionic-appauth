export class Browser {
  constructor() {
    this.onCloseFunction = () => {};
  }
  browserCloseListener(closeBrowserEvent) {
    this.onCloseFunction = closeBrowserEvent;
  }
}
export class DefaultBrowser extends Browser {
  showWindow(url) {
    const openWindow = window.open(url, '_self');
    if (openWindow) {
      openWindow.addEventListener('beforeupload', () => this.onCloseFunction());
    }
    return;
  }
  closeWindow() {
    // Invoking window.close() is not desired. It will either be ignored (most of the time),
    // or it will close the current browser tab if this site was opened via a "_blank" target.
  }
}
