'use strict';

const electron = require('electron');
const path = require('path');

//dialog stuffs
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

// Module to control application life.
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

//events & interprocess comms
ipc.on('open-file-dialog', function(event){
  dialog.showOpenDialog(
    { properties: ['openFile']},
    function(file){
      if(file){
        event.sender.send('selected-file', file);
      }
    }
  )
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
 if (process.platform != 'darwin') {
   app.quit();
 }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {

 // Create the browser window.
 var mainWindow = new BrowserWindow({ width: 800, height: 600, icon: __dirname + '/prompterIcon.ico' });
 mainWindow.setMenu(null);
 // and load the index.html of the app.
 mainWindow.loadURL('file://' + __dirname + '/index.html');

 // Open the devtools.
 // mainWindow.openDevTools();
 // Emitted when the window is closed.
 mainWindow.on('closed', function () {

   // Dereference the window object, usually you would store windows
   // in an array if your app supports multi windows, this is the time
   // when you should delete the corresponding element.
   mainWindow = null;
 });

});
