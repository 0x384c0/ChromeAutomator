class Clicker {
    // Promise wrappers for chrome APIs
    sendCommand(target, command, params) {
        return new Promise((resolve, reject) => {
            chrome.debugger.sendCommand(target, command, params, (response) => {
                resolve(response);
            });
        });
    }
    executeScript(tabId, target, hrefRegex) {
        return new Promise((resolve, reject) => {
            if (typeof hrefRegex !== "undefined") {
                console.log("Clicker >>> executeScript target.code: " + target.code + " hrefRegex: " + hrefRegex)
                chrome.tabs.sendMessage(
                    chrome.devtools.inspectedWindow.tabId,
                    { action: "executeScript", code: target.code, hrefRegex: hrefRegex },
                    (response) => {
                        console.log("Clicker <<< executeScript response: " + response)
                        window.clearInterval(intervalID)
                        if (response instanceof Error)
                            reject(response)
                        else
                            resolve(response)
                    });
                var intervalID = window.setInterval(() => {
                    reject(new Error("executeScript failed hrefRegex: " + hrefRegex + " target: " + target));
                }, 500);
            } else {
                chrome.tabs.executeScript(tabId, target, (response) => {
                    resolve(response);
                });
            }
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

    async clickSelector(target, selector, hrefRegex) {
        var coordinates = null
        if (typeof hrefRegex !== "undefined") {
            let rect = await this.executeScript(target.tabId, { code: "document.querySelector(\"" + selector + "\").getBoundingClientRect()" }, hrefRegex)
            coordinates = {
                x: rect.left + Math.round(rect.width / 2),
                y: rect.top + Math.round(rect.height / 2)
            }
            console.log(rect)
            console.log(coordinates)
        } else {
            const rootNode = await this.sendCommand(target, 'DOM.getDocument');
            var rootNodeId = rootNode.root.nodeId;
            const node = await this.sendCommand(target, 'DOM.querySelector', {
                nodeId: rootNodeId,
                selector: selector
            });
            const { model: model } = await this.sendCommand(target, 'DOM.getBoxModel', node);
            var border = model.border;
            var topLeftX = border[0];
            var topLeftY = border[1];
            var width = model.width;
            var height = model.height;
            coordinates = {
                x: topLeftX + Math.round(width / 2),
                y: topLeftY + Math.round(height / 2)
            }
        }
        return this.clickCoordinates(
            target,
            coordinates.x,
            coordinates.y
        );
    }

    async clickCoordinates(target, x, y) {
        var clickEvent = {
            type: 'mousePressed',
            x: x,
            y: y,
            button: 'left',
            clickCount: 1
        };
        await this.sendCommand(target, 'Input.dispatchMouseEvent', clickEvent);
        clickEvent.type = 'mousePressed';
        this.sendCommand(target, 'Input.dispatchMouseEvent', clickEvent);
        clickEvent.type = 'mouseReleased';
        return this.sendCommand(target, 'Input.dispatchMouseEvent', clickEvent);
    }

    catchError(e) {
        console.log(e)
        alert(e.message)
    }

    //utils
    click(debuggeeId, selector, hrefRegex) {
        return this.clickSelector(debuggeeId, selector, hrefRegex)
    }

    exists(debuggeeId, selector, regex, hrefRegex) {
        let code = "document.querySelector(\"" + selector + "\").innerText"
        return this.executeScript(debuggeeId.tabId, { code: code }, hrefRegex)
            .then((innerText) => {
                let array = innerText.toString().match(regex)
                let result = array != undefined && array != null && array.length != 0
                if (!result) {
                    console.log("found element for selector: " + selector + " regex: " + regex + " but innerText was: " + innerText)
                }
                return result
            })
    }

    wait(debuggeeId, selector, regex, timout, hrefRegex) {
        const delay = 1000
        const repetitions = timout / delay
        return new Promise((resolve, reject) => {
            var clearInterval = this.setIntervalX(delay, repetitions,
                () => {
                    this.exists(debuggeeId, selector, regex, hrefRegex)
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

    waitAndClick(debuggeeId, selector, regex, timout, hrefRegex) {
        return this.wait(debuggeeId, selector, regex, timout, hrefRegex)
            .catch(this.catchError)
            .then(() => { return this.sleep(500) })
            .then(() => { return this.click(debuggeeId, selector, hrefRegex) })
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
    currentTab_executeScript(code, hrefRegex) {
        return this.executeScript(this.currentTabDebuggeeId.tabId, { code: code }, hrefRegex)
    }
    currentTab_click(selector, hrefRegex) {
        return this.click(this.currentTabDebuggeeId, selector, hrefRegex)
    }
    currentTab_clickCoordinate(x, y) {
        return this.clickCoordinates(this.currentTabDebuggeeId, x, y)
    }
    currentTab_exists(selector, regex, hrefRegex) {
        return this.exists(this.currentTabDebuggeeId, selector, regex, hrefRegex)
    }
    currentTab_wait(selector, regex, timout, hrefRegex) {
        return this.wait(this.currentTabDebuggeeId, selector, regex, timout, hrefRegex)
    }
    currentTab_waitAndClick(selector, regex, timout, hrefRegex) {
        return this.waitAndClick(this.currentTabDebuggeeId, selector, regex, timout, hrefRegex)
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