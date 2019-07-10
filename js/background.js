
// Promise wrappers for chrome APIs
function sendCommand(target, command, params) {
    return new Promise(function (resolve, reject) {
        chrome.debugger.sendCommand(target, command, params, function (response) {
            resolve(response);
        });
    });
}
function executeScript(tabId, target) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.executeScript(tabId, target, function (response) {
            resolve(response);
        });
    });
}
function sendMessage(tabId, message) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.sendMessage(tabId, message, function (response) {
            resolve(response);
        });
    });
}


var version = "1.2";
function connectDebugger(tab) {
    return new Promise(function (resolve, reject) {
        var tabId = tab.id;
        var debuggeeId = { tabId: tabId };
        chrome.debugger.attach(debuggeeId, version, () => {
            if (chrome.runtime.lastError)
                reject(chrome.runtime.lastError)
            else
                resolve(debuggeeId)
        });
    })
}

// other utility Promisified methods
function wait(ms) {
    return new Promise(function (resolve, reject) { window.setTimeout(resolve, ms); });
}
function clickSelector(target, selector) {
    return sendCommand(target, 'DOM.getDocument')
        .then(function (rootNode) {
            var rootNodeId = rootNode.root.nodeId;
            console.log('rootNode', rootNode, rootNodeId);
            return sendCommand(target, 'DOM.querySelector', {
                nodeId: rootNodeId,
                selector: selector
            })
                .then(function (node) {
                    console.log('queried node:', node);
                    return sendCommand(target, 'DOM.getBoxModel', node);
                })
                .then(function ({ model: model }) {
                    console.log(model);
                    var border = model.border;
                    var topLeftX = border[0];
                    var topLeftY = border[1];
                    var width = model.width;
                    var height = model.height;
                    var clickEvent = {
                        type: 'mousePressed',
                        x: topLeftX + Math.round(width / 2),
                        y: topLeftY + Math.round(height / 2),
                        button: 'left',
                        clickCount: 1
                    };
                    return sendCommand(target, 'Input.dispatchMouseEvent', clickEvent)
                        .then(function () {
                            clickEvent.type = 'mouseReleased';
                            return sendCommand(target, 'Input.dispatchMouseEvent', clickEvent);
                        });
                });
        });
}

function start(tab) {
    connectDebugger(tab)
        .then((debuggeeId) => {
            clickSelector(debuggeeId,"div[class='vjs-play-control vjs-control ']")
        })
        .catch((e) => {
            alert("Error: " + e)
        })
}


function main() {
    chrome.runtime.onMessage.addListener(onMessage)
}
function onMessage(request, sender, sendResponse) {
    if (request.command == "start") {
        start(request.targetTab)
        sendResponse({ message: "started: " + request.targetTab.id });
    }
}

main()