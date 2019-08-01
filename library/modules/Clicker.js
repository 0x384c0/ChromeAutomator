class Clicker {
    logger = new Logger()

    //run task
    async _exeucteTask(taskHandler) {
        try {
            await taskHandler(this)
        } catch (e) {
            this._disconnectDebuggerIfNeeded(this.currentTabDebuggeeId)
            this._catchError(e)
        }
    }

    //utils
    _catchError(e) {
        console.log(e.message)
        this.onError(e)
        throw e
    }
    //debugger
    _attached = false
    _version = "1.2"

    _connectDebuggerIfNeeded(debuggeeId) {
        return new Promise((resolve, reject) => {
            if (this._attached) {
                resolve()
            } else {
                chrome.debugger.attach(debuggeeId, this._version, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError)
                    } else {
                        this._attached = true
                        resolve()
                    }
                });
            }
        })
    }
    _disconnectDebuggerIfNeeded(debuggeeId) {
        return new Promise((resolve, reject) => {
            if (this._attached) {
                chrome.debugger.detach(debuggeeId, () => {
                    if (chrome.runtime.lastError) {
                        console.log(chrome.runtime.lastError)
                    } else {
                        this._attached = false
                        resolve()
                    }
                });
            } else {
                resolve()
            }
        })
    }
    _onDetach(debuggeeId) {
        this._attached = false
    }

    // Promise wrappers for chrome APIs
    _sendCommand(target, command, params) {
        return this._connectDebuggerIfNeeded(this.currentTabDebuggeeId)
            .catch(this._catchError)
            .then(() => {
                return new Promise((resolve, reject) => {
                    chrome.debugger.sendCommand(target, command, params, (response) => {
                        resolve(response);
                    });
                })
            });
    }
    _executeScript(tabId, target, hrefRegex) {
        return new Promise((resolve, reject) => {
            if (hrefRegex != null) {
                this.logger.log("Clicker >>> executeScript target.code: " + target.code + " hrefRegex: " + hrefRegex)
                var intervalID = window.setInterval(() => {
                    reject(new Error("executeScript failed hrefRegex: " + hrefRegex + " target: " + target));
                }, 1000);
                chrome.tabs.sendMessage(
                    chrome.devtools.inspectedWindow.tabId,
                    { action: "executeScript", code: target.code, hrefRegex: hrefRegex },
                    (response) => {
                        this.logger.log("Clicker <<< executeScript response: " + response)
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
                    resolve(response[0]);
                });
            }
        });
    }
    _sendMessage(tabId, message) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    this._attached = true
                    resolve(response)
                }
            });
        });
    }


    // internal utils

    _setIntervalX(delay, repetitions, callback, finished) {
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

    _sleep(ms) {
        return new Promise((resolve, reject) => { window.setTimeout(resolve, ms); });
    }

    //ACTIONS
    async _clickWithDebugger(debuggeeId, selector, hrefRegex, offset) {
        var coordinates = null
        if (hrefRegex != null) {
            let rect = await this._getRect(debuggeeId, selector, hrefRegex)
            coordinates = {
                x: rect.left + Math.round(rect.width / 2),
                y: rect.top + Math.round(rect.height / 2)
            }
            this.logger.log(rect)
        } else {
            const rootNode = await this._sendCommand(debuggeeId, 'DOM.getDocument');
            var rootNodeId = rootNode.root.nodeId;
            const node = await this._sendCommand(debuggeeId, 'DOM.querySelector', {
                nodeId: rootNodeId,
                selector: selector
            });
            const { model: model } = await this._sendCommand(debuggeeId, 'DOM.getBoxModel', node);
            var border = model.border;
            var topLeftX = border[0];
            var topLeftY = border[1];
            var width = model.width;
            var height = model.height;
            coordinates = {
                x: topLeftX + Math.round(width / 2),
                y: topLeftY + Math.round(height / 2)
            }
            this.logger.log(JSON.stringify(model))
        }
        if (offset != null) {
            coordinates.x += offset.x
            coordinates.y += offset.y
            this.logger.log("offset x: " + offset.x + " y: " + offset.y)
        }
        return this._clickCoordinates(
            debuggeeId,
            coordinates.x,
            coordinates.y
        );
    }

    async _clickCoordinates(debuggeeId, x, y) {
        this.logger.log("clickCoordinates x: " + x + " y: " + y)
        var clickEvent = {
            type: 'mouseMoved',
            x: x,
            y: y,
            button: 'left',
            clickCount: 1
        };
        await this._sendCommand(debuggeeId, 'Input.dispatchMouseEvent', clickEvent);
        clickEvent.type = 'mousePressed';
        await this._sendCommand(debuggeeId, 'Input.dispatchMouseEvent', clickEvent);
        clickEvent.type = 'mouseReleased';
        return this._sendCommand(debuggeeId, 'Input.dispatchMouseEvent', clickEvent);
    }

    async _scrollIntoViewIfNeeded(debuggeeId, selector, hrefRegex) {
        await this._executeScript(debuggeeId.tabId, { code: "document.querySelector(\"" + selector + "\").scrollIntoViewIfNeeded()" }, hrefRegex)
        await this._sleep(500)
    }

    async _click(debuggeeId, selector, isTrusted, hrefRegex, offset) {
        if (isTrusted) {
            await this._scrollIntoViewIfNeeded(debuggeeId, selector, hrefRegex)
            return this._clickWithDebugger(debuggeeId, selector, hrefRegex, offset)
        } else {
            return this._executeScript(debuggeeId.tabId, { code: "document.querySelector(\"" + selector + "\").dispatchEvent(new MouseEvent(\"click\"))" }, hrefRegex)
        }
    }

    _waitAndClick(debuggeeId, selector, isTrusted, innerTextRegex, waitTimout, hrefRegex, offset) {
        return this._wait(debuggeeId, selector, innerTextRegex, waitTimout, hrefRegex)
            .catch(this._catchError)
            .then(() => { return this._sleep(500) })
            .then(() => { return this._click(debuggeeId, selector, isTrusted, hrefRegex, offset) })
    }

    _goBack(debuggeeId) {
        return this._executeScript(debuggeeId.tabId, { code: "window.history.back()" })
    }

    //GETTERS
    async _getRect(debuggeeId, selector, hrefRegex) {
        const rect = await this._executeScript(debuggeeId.tabId, { code: "document.querySelector(\"" + selector + "\").getBoundingClientRect()" }, hrefRegex)
        await this._sleep(100)
        if (isNaN(rect.x) || isNaN(rect.y))
            throw new Error("Illegal rect: " + rect + " selector: " + selector + " hrefRegex: " + hrefRegex)
        else
            return rect
    }

    _search(debuggeeId, regex, hrefRegex) {
        return this._executeScript(debuggeeId.tabId, { code: "document.body.innerHTML.match(new RegExp(\"" + regex + "\"))" }, hrefRegex)
    }

    async _exists(debuggeeId, selector, innerTextRegex, hrefRegex) {
        let code = "document.querySelector(\"" + selector + "\").innerText"
        var innerText = null
        try {
            innerText = await this._executeScript(debuggeeId.tabId, { code: code }, hrefRegex);
        } catch (e) {
            if (e.message == "The message port closed before a response was received.") {
                return false
            } else {
                throw e
            }
        }
        if (innerText == null || !(typeof innerText === 'string' || innerText instanceof String)) {
            this.logger.log("not found element for selector: " + selector)
            return false // not found or error
        } else if (innerTextRegex == null) {
            return true; // no checks need, return
        } else {
            let array = innerText.toString().match(innerTextRegex);
            let result = array != undefined && array != null && array.length != 0;
            if (!result) {
                this.logger.log("found element for selector: " + selector + " innerTextRegex: " + innerTextRegex + " but innerText was: " + innerText);
            }
            return result;
        }
    }


    async _calculateOffset(debuggeeId, selectorsInfo) {
        const result = { x: 0, y: 0 }
        for (const selectorInfo of selectorsInfo) {
            const hrefRegex = selectorInfo.hrefRegex
            const selector = selectorInfo.selector
            const rect = await this._getRect(debuggeeId, selector, hrefRegex)
            result.x += rect.left
            result.y += rect.top
        }
        return result
    }

    //OTHERS
    _wait(debuggeeId, selector, innerTextRegex, waitTimout, hrefRegex) {
        const delay = 1000
        const repetitions = waitTimout / delay
        return new Promise((resolve, reject) => {
            var clearInterval = this._setIntervalX(delay, repetitions,
                () => {
                    this._exists(debuggeeId, selector, innerTextRegex, hrefRegex)
                        .then((exists) => {
                            if (exists) {
                                clearInterval()
                                resolve(exists)
                            }
                        })
                        .catch(print)
                },
                () => {
                    reject(new Error("Element with selector: \"" + selector + "\" innerTextRegex: \"" + innerTextRegex + "\" not exists."))
                }
            )
        })
    }

    _waitRequest(urlRegex, waitTimout) {
        return new Promise((resolve, reject) => {
            let intervalID = window.setInterval(() => {
                this.requestListener.stop()
                reject(new Error("Clicker: waitRequest timeout urlRegex: " + urlRegex))
            }, waitTimout)


            this.logger.log("Clicker >>> waitRequest urlRegex: " + urlRegex)
            this.requestListener.start(urlRegex, (url, body) => {
                if (new RegExp(urlRegex).test(url)) {
                    this.logger.log("Clicker <<< waitRequest url: " + url)
                    window.clearInterval(intervalID)
                    this.requestListener.stop()
                    resolve(body)
                }
            });
        })
    }

    //list of public functions
    getAllowedInScriptMethodsNames() {
        return [
            "scrollIntoViewIfNeeded",
            "clickCoordinate",
            "click",
            "goBack",
            "exists",
            "search",
            "calculateOffset",
            "executeScript",
            "sleep",
            "wait",
            "waitRequest"
        ]
    }

    //PUBLIC
    //TODO: add wait until page load
    //actions
    scrollIntoViewIfNeeded(params) {
        return this._scrollIntoViewIfNeeded(this.currentTabDebuggeeId, params.selector, params.hrefRegex)
    }
    clickCoordinate(params) {
        return this._clickCoordinates(this.currentTabDebuggeeId, params.x, params.y)
    }
    async click(params) {
        if (params.iframesSelectorInfo != null && params.offset != null)
            throw "iframesSelectorInfo and offset conflicting. params: " + params

        if ((params.innerTextRegex != null && params.waitTimout == null) || (params.innerTextRegex == null && params.waitTimout != null))
            throw "innerTextRegex and waitTimout must be set. params: " + params

        if (params.iframesSelectorInfo != null && params.offset == null) {
            await this._scrollIntoViewIfNeeded(this.currentTabDebuggeeId, params.selector, params.hrefRegex)
            params.offset = await this._calculateOffset(this.currentTabDebuggeeId, params.iframesSelectorInfo)
        }

        if (params.innerTextRegex != null && params.waitTimout != null) {
            await this._waitAndClick(this.currentTabDebuggeeId, params.selector, params.isTrusted, params.innerTextRegex, params.waitTimout, params.hrefRegex, params.offset)
        } else {
            await this._click(this.currentTabDebuggeeId, params.selector, params.isTrusted, params.hrefRegex, params.offset)
        }
    }
    goBack(params) {
        return this._goBack(this.currentTabDebuggeeId)
    }
    //getters
    exists(params) {
        return this._exists(this.currentTabDebuggeeId, params.selector, params.innerTextRegex, params.hrefRegex)
    }
    search(params) {
        return this._search(this.currentTabDebuggeeId, params.regex, params.hrefRegex)
    }
    calculateOffset(params) {
        return this._calculateOffset(this.currentTabDebuggeeId, params.selectorsInfo)
    }
    //others
    executeScript(params) {
        return this._executeScript(this.currentTabDebuggeeId.tabId, { code: params.code }, params.hrefRegex)
    }
    sleep(time) {
        return this._sleep(time)
    }
    wait(params) {
        return this._wait(this.currentTabDebuggeeId, params.selector, params.innerTextRegex, params.waitTimout, params.hrefRegex)
    }
    waitRequest(params) {
        return this._waitRequest(params.urlRegex, params.waitTimout)
    }

    //main
    constructor(requestListener, onError) {
        this.requestListener = requestListener
        this.onError = onError
        chrome.debugger.onDetach.addListener(this._onDetach);
    }

    async start(tabId, taskHandler) {
        this.logger.reset()
        this.currentTabDebuggeeId = { tabId: tabId }
        await this._exeucteTask(taskHandler)
        await this._disconnectDebuggerIfNeeded(this.currentTabDebuggeeId)
    }
}