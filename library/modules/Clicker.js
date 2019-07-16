class Clicker {
    // Promise wrappers for chrome APIs
    sendCommand(target, command, params) {
        return new Promise((resolve, reject) => {
            chrome.debugger.sendCommand(target, command, params, (response) => {
                resolve(response);
            });
        });
    }
    executeScript(tabId, target) {
        return new Promise((resolve, reject) => {
            chrome.tabs.executeScript(tabId, target, (response) => {
                resolve(response);
            });
        });
    }
    sendMessage(tabId, message) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                resolve(response);
            });
        });
    }

    //debugger

    attached = false
    version = "1.2"

    connectDebugger(tab) {
        return new Promise((resolve, reject) => {
            var tabId = tab.id;
            var debuggeeId = { tabId: tabId };
            if (this.attached) {
                resolve(debuggeeId)
            } else {
                chrome.debugger.attach(debuggeeId, this.version, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError)
                    } else {
                        this.attached = true
                        resolve(debuggeeId)
                    }
                });
            }
        })
    }
    onDetach(debuggeeId) {
        this.attached = false
    }


    // internal utils

    setIntervalX(delay, repetitions, callback, finished) {
        var x = 0;
        var intervalID = window.setInterval(() => {
            callback();
            if (++x === repetitions) {
                window.clearInterval(intervalID);
                finished()
            }
        }, delay);
        return () => { window.clearInterval(intervalID) }
    }

    sleep(ms) {
        return new Promise((resolve, reject) => { window.setTimeout(resolve, ms); });
    }

    clickSelector(target, selector) {
        return this.sendCommand(target, 'DOM.getDocument')
            .then((rootNode) => {
                var rootNodeId = rootNode.root.nodeId;
                return this.sendCommand(target, 'DOM.querySelector', {
                    nodeId: rootNodeId,
                    selector: selector
                })
                    .then((node) => {
                        return this.sendCommand(target, 'DOM.getBoxModel', node);
                    })
                    .then(({ model: model }) => {
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
                        return this.sendCommand(target, 'Input.dispatchMouseEvent', clickEvent)
                            .then(() => {
                                clickEvent.type = 'mouseReleased';
                                return this.sendCommand(target, 'Input.dispatchMouseEvent', clickEvent);
                            });
                    });
            });
    }

    catchError(e) {
        console.log(e)
        alert(e.message)
    }

    //utils
    click(debuggeeId, selector) {
        return this.clickSelector(debuggeeId, selector)
    }

    exists(debuggeeId, selector, regex) {
        let code = "document.querySelector(\"" + selector + "\").innerText"
        return this.executeScript(debuggeeId.tabId, { code: code })
            .then((innerText) => {
                let array = innerText.toString().match(regex)
                let result = array != undefined && array != null && array.length != 0
                if (!result) {
                    console.log("found element for selector: " + selector + " regex: " + regex + " but innerText was: " + innerText)
                }
                return result
            })
    }

    wait(debuggeeId, selector, regex, timout) {
        const delay = 1000
        const repetitions = timout / delay
        return new Promise((resolve, reject) => {
            var clearInterval = this.setIntervalX(delay, repetitions,
                () => {
                    this.exists(debuggeeId, selector, regex)
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

    waitAndClick(debuggeeId, selector, regex, timout) {
        return this.wait(debuggeeId, selector, regex, timout)
            .catch(this.catchError)
            .then(() => { return this.sleep(500) })
            .then(() => { return this.click(debuggeeId, selector) })
    }

    waitRequest(debuggeeId, regex, timout) {
        return new Promise((resolve, reject) => {
            let filter = {
                urls: [regex]
            }
            let onCompleted = (details) => {
                if (details.tabId == debuggeeId.tabId) {
                    window.clearInterval(intervalID)
                    chrome.devtools.network.onRequestFinished.removeListener(this.onCompleted)
                }
            }
            chrome.devtools.network.onRequestFinished.addListener(this.onCompleted, filter)
            var intervalID = window.setInterval(() => {
                chrome.devtools.network.onRequestFinished.removeListener(this.onCompleted)
                reject(new Error("waitRequest timeout regex: " + regex))
            }, timout)
        })
    }

    //active tab wrappers
    currentTab_click(selector) {
        return this.click(this.currentTabDebuggeeId, selector)
    }
    currentTab_exists(selector, regex) {
        return this.exists(this.currentTabDebuggeeId, selector, regex)
    }
    currentTab_wait(selector, regex, timout) {
        return this.wait(this.currentTabDebuggeeId, selector, regex, timout)
    }
    currentTab_waitAndClick(selector, regex, timout) {
        return this.waitAndClick(this.currentTabDebuggeeId, selector, regex, timout)
    }
    currentTab_waitRequest(regex, timout) {
        return this.waitRequest(this.currentTabDebuggeeId, regex, timout)
    }

    //main
    constructor(taskHandler) {
        this.taskHandler = taskHandler
        chrome.debugger.onDetach.addListener(this.onDetach);
    }

    start(tab) {
        return this.connectDebugger(tab)
            .catch(this.catchError)
            .then(debuggeeId => { this.exeucteTask(debuggeeId) })
            .catch(this.catchError)
    }

    async exeucteTask(debuggeeId) {
        this.currentTabDebuggeeId = debuggeeId
        await this.taskHandler(this)
    }
}