
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

//debugger

var attached = false
var version = "1.2";
function connectDebugger(tab) {
    return new Promise(function (resolve, reject) {
        var tabId = tab.id;
        var debuggeeId = { tabId: tabId };
        if (attached) {
            resolve(debuggeeId)
        } else {
            chrome.debugger.attach(debuggeeId, version, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    attached = true
                    resolve(debuggeeId)
                }
            });
        }
    })
}
function onDetach(debuggeeId) {
    attached = false
}


// internal utils
function print(obj) {
    console.log(obj)
}

function setIntervalX(delay, repetitions, callback, finished) {
    var x = 0;
    var intervalID = window.setInterval(function () {
        callback();
        if (++x === repetitions) {
            window.clearInterval(intervalID);
            finished()
        }
    }, delay);
    return () => { window.clearInterval(intervalID) }
}

function sleep(ms) {
    return new Promise(function (resolve, reject) { window.setTimeout(resolve, ms); });
}

function clickSelector(target, selector) {
    return sendCommand(target, 'DOM.getDocument')
        .then(function (rootNode) {
            var rootNodeId = rootNode.root.nodeId;
            return sendCommand(target, 'DOM.querySelector', {
                nodeId: rootNodeId,
                selector: selector
            })
                .then(function (node) {
                    return sendCommand(target, 'DOM.getBoxModel', node);
                })
                .then(function ({ model: model }) {
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

function catchError(e) {
    print(e)
    alert(e.message)
}

//utils
function click(debuggeeId, selector) {
    return clickSelector(debuggeeId, selector)
}

function exists(debuggeeId, selector, regex) {
    let code = "document.querySelector(\"" + selector + "\").innerText"
    return executeScript(debuggeeId.tabId, { code: code })
        .then((innerText) => {
            let array = innerText.toString().match(regex)
            let result = array != undefined && array != null && array.length != 0
            if (!result) {
                print("found element for selector: " + selector + " regex: " + regex + " but innerText was: " + innerText)
            }
            return result
        })
}

function wait(debuggeeId, selector, regex, timout) {
    const delay = 1000
    const repetitions = timout / delay
    return new Promise((resolve, reject) => {
        var clearInterval = setIntervalX(delay, repetitions,
            () => {
                exists(debuggeeId, selector, regex)
                    .then((exists) => {
                        if (exists) {
                            clearInterval()
                            resolve(exists)
                        }
                    })
                    .catch(print)
            },
            () => {
                reject(new Error("Element with selector: \"" + selector + "\" regex: \"" + regex + "\" not exists."))
            }
        )
    })
}

function waitAndClick(debuggeeId, selector, regex, timout) {
    return wait(debuggeeId, selector, regex, timout)
        .catch(catchError)
        .then(() => { return sleep(500) })
        .then(() => { return click(debuggeeId, selector) })
}

function waitRequest(debuggeeId, regex, timout) {
    return new Promise(function (resolve, reject) {
        let filter = {
            urls: [regex]
        }
        let onCompleted = (details) => {
            if (details.tabId == debuggeeId.tabId) {
                window.clearInterval(intervalID)
                chrome.devtools.network.onRequestFinished.removeListener(onCompleted)
            }
        }
        chrome.devtools.network.onRequestFinished.addListener(onCompleted, filter)
        var intervalID = window.setInterval(() => {
            chrome.devtools.network.onRequestFinished.removeListener(onCompleted)
            reject(new Error("waitRequest timeout regex: " + regex))
        }, timout)
    })
}

//main
function main() {
    chrome.debugger.onDetach.addListener(onDetach);
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.command) {
            case "start":
                sendResponse({ message: "started: " + request.targetTab.id });
                return start(request.targetTab)
                break;
            case "abort":
                alert("TODO: implement abortion")
                break;
        }
    })
}

function start(tab) {
    return connectDebugger(tab)
        .then(debuggeeId => { exeucteTask(debuggeeId) })
        .catch(catchError)
}

function exeucteTask(debuggeeId) {
    return click(debuggeeId, "div[class='vjs-play-control vjs-control ']")
        .then(() => {
            return wait(debuggeeId, "div[class='skip-button']", "^Пропустить рекламу$", 25000)
        })
        .then(() => {
            print("Finished")
        })
}

main()