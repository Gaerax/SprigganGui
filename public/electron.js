// Module to control the application lifecycle and the native browser window.
const { app, BrowserWindow, Menu, protocol } = require("electron");
const path = require("path");
const { spawn } = require('child_process');
const { get } = require("http");


/*************************************************************
 * Python RPC process
 *************************************************************/
const PY_DIST_FOLDER = 'bin'

let pyProc = null
let pyPort = null

const selectPort = () => {
	pyPort = 5235
	return pyPort
}

const createPyProc = () => {
	let port = '' + selectPort()

	console.log("Starting  RPC...", path.join("./", "spriggan-rpc.exe"));

	pyProc = spawn(path.join("./", "spriggan-rpc.exe"), [port]);

	pyProc.stdout.on('data', function (data) {
		console.log("RPC: " + data.toString());
	});

	pyProc.stderr.on('data', (data) => {
		console.error(`RPC error: ${data}`);
	});

	pyProc.on('close', (code) => {
		console.log(`RPC process exited with code ${code}`);
	});

	if (pyProc != null) {
		console.log('RPC process success on port ' + port);
	}
	else {

		console.log("RPC process failed to start.");
	}
}

const exitPyProc = () => {
	console.log("Killing Spriggan RPC", pyProc.pid)
	pyProc.kill()
	get('http://localhost:' + pyPort + '/kill', (resp) => {
		console.log("RPC kill response: " + resp);
	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
	process.terminate(pyProc.pid);
	process.kill(pyProc.pid);
	pyProc = null
	pyPort = null
}

app.on('ready', createPyProc)
app.on('will-quit', exitPyProc)


/*************************************************************
 * window management
 *************************************************************/

function UpsertKeyValue(obj, keyToChange, value) {
	const keyToChangeLower = keyToChange.toLowerCase();
	for (const key of Object.keys(obj)) {
		if (key.toLowerCase() === keyToChangeLower) {
			// Reassign old key
			obj[key] = value;
			// Done
			return;
		}
	}
	// Insert at end instead
	obj[keyToChange] = value;
}

// Create the native browser window.
function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 1600,
		height: 1000,
		title: "Spriggan Client v0.2",
		darkTheme: true,
		// Set the path of an additional "preload" script that can be used to
		// communicate between node-land and browser-land.
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
		(details, callback) => {
			const { requestHeaders } = details;
			UpsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', ['*']);
			UpsertKeyValue(requestHeaders, 'Access-Control-Allow-Credentials', true);
			callback({ requestHeaders });
		},
	);
	
	mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
		const { responseHeaders } = details;
		callback({
			responseHeaders,
		});
	});

	// In production, set the initial browser path to the local bundle generated
	// by the Create React App build process.
	// In development, set it to localhost to allow live/hot-reloading.
	// const appURL = app.isPackaged
	// 	? url.format({
	// 			pathname: path.join(__dirname, "index.html"),
	// 			protocol: "file:",
	// 			slashes: true,
	// 		})
	// 	: "http://localhost:3023";
	
	// mainWindow.loadURL("http://localhost:3023");

	// Automatically open Chrome's DevTools in development mode.
	if (!app.isPackaged) {
		mainWindow.webContents.openDevTools();
	}
	mainWindow.webContents.loadFile(path.join(__dirname, "dapps/spriggan-marketplace-dapp/index.html"));

	const menuTemplate = [
		{
			label: 'File',
			submenu: [
				{
					role: 'set'
				}
			]
		},
	
		{
			label: 'Edit',
			submenu: [
				{
					role: 'undo'
				},
				{
					role: 'redo'
				},
				{
					type: 'separator'
				},
				{
					role: 'cut'
				},
				{
					role: 'copy'
				},
				{
					role: 'paste'
				}
			]
		},
		
		{
			label: 'View',
			submenu: [
				{
					role: 'reload'
				},
				{
					role: 'toggledevtools'
				},
				{
					type: 'separator'
				},
				{
					role: 'resetzoom'
				},
				{
					role: 'zoomin'
				},
				{
					role: 'zoomout'
				},
				{
					type: 'separator'
				},
				{
					role: 'togglefullscreen'
				}
			]
		},
		
		{
			label: 'Window',
			submenu: [
				{
					role: 'minimize'
				},
				{
					role: 'close'
				}
			]
		},
	
		{
			label: 'Help',
			submenu: [
				{
					label: 'About Spriggan Client',
					click: () => {
						mainWindow.webContents.loadFile(path.join(__dirname, "about.html"))
					}
				}
			]
		},
		{
			label: 'Library',
			click: () => {
				mainWindow.webContents.loadFile(path.join(__dirname, "dapps/spriggan-library-dapp/index.html"))
			}
		},
		{
			label: 'Marketplace',
			click: () => {
				mainWindow.webContents.loadFile(path.join(__dirname, "dapps/spriggan-marketplace-dapp/index.html"))
			}
		},
		{
			label: 'Publishing',
			click: () => {
				mainWindow.webContents.loadFile(path.join(__dirname, "dapps/spriggan-marketplace-publishing-dapp/index.html"))
			}
		},
	]
	
	const menu = Menu.buildFromTemplate(menuTemplate)
	Menu.setApplicationMenu(menu)
}

// Setup a local proxy to adjust the paths of requested files when loading
// them from the local production bundle (e.g.: local fonts, etc...).
function setupLocalFilesNormalizerProxy() {
	protocol.registerHttpProtocol(
		"file",
		(request, callback) => {
			const url = request.url.substr(8);
			callback({ path: path.normalize(`${__dirname}/${url}`) });
		},
		(error) => {
			if (error) console.error("Failed to register protocol");
		}
	);
}

// This method will be called when Electron has finished its initialization and
// is ready to create the browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow();
	setupLocalFilesNormalizerProxy();

	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS.
// There, it's common for applications and their menu bar to stay active until
// the user quits	explicitly with Cmd + Q.
app.on("window-all-closed", function () {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// If your app has no need to navigate or only needs to navigate to known pages,
// it is a good idea to limit navigation outright to that known scope,
// disallowing any other kinds of navigation.
// const allowedNavigationDestinations = "https://my-electron-app.com";
// app.on("web-contents-created", (event, contents) => {
// 	contents.on("will-navigate", (event, navigationUrl) => {
// 		const parsedUrl = new URL(navigationUrl);

// 		if (!allowedNavigationDestinations.includes(parsedUrl.origin)) {
// 			event.preventDefault();
// 		}
// 	});
// });

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

