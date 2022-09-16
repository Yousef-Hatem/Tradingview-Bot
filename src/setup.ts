import ws from "windows-shortcuts";

function createShortcut (path: string = ''): Promise<boolean> {
  console.log(path);
  return new Promise((resolve, reject) => {
    ws.create(path + "Tradingview Bot.lnk", {
      target : 'node',
      workingDir: process.cwd(),
      args : 'dist/index.js',
      runStyle : ws.NORMAL,
      icon: process.cwd() + '/icon.ico'
    }, (err) => {
      if (err) {
        reject();
      } else {
        resolve(true);
      }
    });
  });
}

createShortcut()
.then(() => {
  createShortcut("%APPDATA%/../../Desktop/")
  .then(() => {
    console.log("\n\nThe bot has been successfully installed");
  });
});