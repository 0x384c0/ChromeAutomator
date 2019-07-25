class Clicker {

    //debugger
    attached = false
    version = "1.2"

    connectDebuggerIfNeeded(debuggeeId) {
        return new Promise((resolve, reject) => {
            if (this.attached) {
                resolve()
            } else {
                chrome.debugger.attach(debuggeeId, this.version, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError)
                    } else {
                        this.attached = true
                        resolve()
                    }
                });
            }
        })
    }
    onDetach(debuggeeId) {
        this.attached = false
    }

    // Promise wrappers for chrome APIs
    sendCommand(target, command, params) {
        return this.connectDebuggerIfNeeded(this.currentTabDebuggeeId)
            .catch(this.catchError)
            .then(() => {
                return new Promise((resolve, reject) => {
                    chrome.debugger.sendCommand(target, command, params, (response) => {
                        resolve(response);
                    });
                })
            });
    }
    executeScript(tabId, target, hrefRegex) {
        return new Promise((resolve, reject) => {
            if (hrefRegex != null) {
                console.log("Clicker >>> executeScript target.code: " + target.code + " hrefRegex: " + hrefRegex)
                var intervalID = window.setInterval(() => {
                    reject(new Error("executeScript failed hrefRegex: " + hrefRegex + " target: " + target));
                }, 1000);
                chrome.tabs.sendMessage(
                    chrome.devtools.inspectedWindow.tabId,
                    { action: "executeScript", code: target.code, hrefRegex: hrefRegex },
                    (response) => {
                        console.log("Clicker <<< executeScript response: " + response)
                        window.clearInterval(intervalID)
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError)
                        } else {
                            if (response instanceof Error)
                                reject(response)
                            else
                                resolve(response)
                        }
                    });
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
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    this.attached = true
                    resolve(response)
                }
            });
        });
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

    async clickWithDebugger(debuggeeId, selector, hrefRegex, offset) {
        var coordinates = null
        if (hrefRegex != null) {
            let rect = await this.getRect(debuggeeId, selector, hrefRegex)
            coordinates = {
                x: rect.left + Math.round(rect.width / 2),
                y: rect.top + Math.round(rect.height / 2)
            }
            console.log(rect)
        } else {
            const rootNode = await this.sendCommand(debuggeeId, 'DOM.getDocument');
            var rootNodeId = rootNode.root.nodeId;
            const node = await this.sendCommand(debuggeeId, 'DOM.querySelector', {
                nodeId: rootNodeId,
                selector: selector
            });
            const { model: model } = await this.sendCommand(debuggeeId, 'DOM.getBoxModel', node);
            var border = model.border;
            var topLeftX = border[0];
            var topLeftY = border[1];
            var width = model.width;
            var height = model.height;
            coordinates = {
                x: topLeftX + Math.round(width / 2),
                y: topLeftY + Math.round(height / 2)
            }
            console.log(JSON.stringify(model))
        }
        if (offset != null) {
            coordinates.x += offset.x
            coordinates.y += offset.y
            console.log("offset x: " + offset.x + " y: " + offset.y)
        }
        return this.clickCoordinates(
            debuggeeId,
            coordinates.x,
            coordinates.y
        );
    }

    async getRect(debuggeeId, selector, hrefRegex) {
        const rect = await this.executeScript(debuggeeId.tabId, { code: "document.querySelector(\"" + selector + "\").getBoundingClientRect()" }, hrefRegex)
        await this.sleep(100)
        if (isNaN(rect.x) || isNaN(rect.y))
            throw new Error("Illegal rect: " + rect + " selector: " + selector + " hrefRegex: " + hrefRegex)
        else
            return rect
    }

    async clickCoordinates(debuggeeId, x, y) {
        console.log("clickCoordinates x: " + x + " y: " + y)
        var clickEvent = {
            type: 'mousePressed',
            x: x,
            y: y,
            button: 'left',
            clickCount: 1
        };
        await this.sendCommand(debuggeeId, 'Input.dispatchMouseEvent', clickEvent);
        clickEvent.type = 'mousePressed';
        this.sendCommand(debuggeeId, 'Input.dispatchMouseEvent', clickEvent);
        clickEvent.type = 'mouseReleased';
        return this.sendCommand(debuggeeId, 'Input.dispatchMouseEvent', clickEvent);
    }

    catchError(e) {
        throw e
    }

    //utils
    async click(debuggeeId, selector, isTrusted, hrefRegex, offset) {
        if (isTrusted) {
            await this.executeScript(debuggeeId.tabId, { code: "document.querySelector(\"" + selector + "\").scrollIntoViewIfNeeded()" }, hrefRegex)
            await this.sleep(500)
            return this.clickWithDebugger(debuggeeId, selector, hrefRegex, offset)
        } else {
            return this.executeScript(debuggeeId.tabId, { code: "document.querySelector(\"" + selector + "\").dispatchEvent(new MouseEvent(\"click\"))" }, hrefRegex)
        }
    }

    async exists(debuggeeId, selector, regex, hrefRegex) {
        let code = "document.querySelector(\"" + selector + "\").innerText"
        var innerText = null
        try {
            innerText = await this.executeScript(debuggeeId.tabId, { code: code }, hrefRegex);
        } catch (e) {
            if (e.message == "The message port closed before a response was received.") {
                return false
            } else {
                throw e
            }
        }
        if (innerText == null || !(typeof innerText === 'string' || innerText instanceof String)) {
            console.log("not found element for selector: " + selector)
            return false // not found or error
        } else if (regex == null) {
            return true; // no checks need, return
        } else {
            let array = innerText.toString().match(regex);
            let result = array != undefined && array != null && array.length != 0;
            if (!result) {
                console.log("found element for selector: " + selector + " regex: " + regex + " but innerText was: " + innerText);
            }
            return result;
        }
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

    waitAndClick(debuggeeId, selector, isTrusted, regex, timout, hrefRegex, offset) {
        return this.wait(debuggeeId, selector, regex, timout, hrefRegex)
            .catch(this.catchError)
            .then(() => { return this.sleep(500) })
            .then(() => { return this.click(debuggeeId, selector, isTrusted, hrefRegex, offset) })
    }

    waitRequest(regex, timout) {
        return new Promise((resolve, reject) => {
            let intervalID = window.setInterval(() => {
                this.requestListener.stop()
                reject(new Error("Clicker: waitRequest timeout regex: " + regex))
            }, timout)


            console.log("Clicker >>> waitRequest regex: " + regex)
            this.requestListener.start(regex, (url, body) => {
                if (new RegExp(regex).test(url)) {
                    console.log("Clicker <<< waitRequest url: " + url)
                    window.clearInterval(intervalID)
                    this.requestListener.stop()
                    resolve(body)
                }
            });
        })
    }

    search(debuggeeId, regex, hrefRegex) {
        return this.executeScript(debuggeeId.tabId, { code: "document.body.innerHTML.match(new RegExp(\"" + regex + "\"))" }, hrefRegex)
    }

    goBack(debuggeeId) {
        return this.executeScript(debuggeeId.tabId, { code: "window.history.back()" })
    }

    async calculateOffset(debuggeeId, selectorsInfo) {
        const result = { x: 0, y: 0 }
        for (const selectorInfo of selectorsInfo) {
            const hrefRegex = selectorInfo.hrefRegex
            const selector = selectorInfo.selector
            const rect = await this.getRect(debuggeeId, selector, hrefRegex)
            result.x += rect.left
            result.y += rect.top
        }
        return result
    }

    //TODO: use objects as  parameters
    //TODO: add wait until page load
    //active tab wrappers
    currentTab_executeScript(code, hrefRegex) {
        return this.executeScript(this.currentTabDebuggeeId.tabId, { code: code }, hrefRegex)
    }
    currentTab_click(selector, isTrusted, hrefRegex, offset) {
        return this.click(this.currentTabDebuggeeId, selector, isTrusted, hrefRegex, offset)
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
    currentTab_waitAndClick(selector, isTrusted, regex, timout, hrefRegex, offset) {
        return this.waitAndClick(this.currentTabDebuggeeId, selector, isTrusted, regex, timout, hrefRegex, offset)
    }
    currentTab_search(regex, hrefRegex) {
        return this.search(this.currentTabDebuggeeId, regex, hrefRegex)
    }
    currentTab_goBack() {
        return this.goBack(this.currentTabDebuggeeId)
    }
    currentTab_calculateOffset(selectorsInfo) {
        return this.calculateOffset(this.currentTabDebuggeeId, selectorsInfo)
    }

    //main
    constructor(requestListener) {
        this.requestListener = requestListener
        chrome.debugger.onDetach.addListener(this.onDetach);
    }

    start(tab, taskHandler) {
        this.currentTabDebuggeeId = { tabId: tab.id }
        this.exeucteTask(taskHandler)
    }

    async exeucteTask(taskHandler) {
        try {
            await taskHandler(this)
        } catch (e) {
            this.catchError(e)
        }
    }
}