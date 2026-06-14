const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('sn32Desktop', {
  isDesktop: true,
});
