let DISCONNECT_DEBUGGER_AFTER_CLICK_COORDINATE = true 
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
    _isString(value) {
        return typeof value === 'string' || value instanceof String;
    }
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
                var clearInterval = this._setIntervalX(1000,1,() => {
                    reject(new Error("executeScript failed hrefRegex: " + hrefRegex + " target: " + target));
                });

                chrome.tabs.sendMessage(
                    chrome.devtools.inspectedWindow.tabId,
                    { action: "getFullUrl", code: target.code, hrefRegex: hrefRegex },
                    (frameFullUrl) => {
                        this.logger.log("Clicker <<< getFullUrl frameFullUrl: " + frameFullUrl)
                        clearInterval()
                        let lastError = chrome.runtime.lastError
                        if (lastError) {
                            reject(lastError)
                        } else if (frameFullUrl instanceof Error){
                            reject(frameFullUrl)
                        } else if (!(typeof frameFullUrl === 'string' || frameFullUrl instanceof String)){
                            reject(new Error("getFullUrl is not a string"))
                        }else {
                            //eval code
                            chrome.devtools.inspectedWindow.eval(
                                "function executeCode(){" +
                                "return " +
                                target.code +
                                "};" + 
                                "window.dispatchEvent(new CustomEvent('inspectedWindowExecuteScriptResult', { detail: { result: executeCode() } }));",
                                {frameURL:frameFullUrl}
                                )
                            //wait for eval complenet
                            window.setTimeout(() => {
                                chrome.tabs.sendMessage(
                                    chrome.devtools.inspectedWindow.tabId,
                                    { action: "getLastInspectedWindowExecuteScriptResult", hrefRegex: hrefRegex },
                                    (response) => {
                                        //get and return last result
                                        resolve(response)
                                });
                            }, 50)
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
                if (finished != null)
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
        await this._sendCommand(debuggeeId, 'Input.dispatchMouseEvent', clickEvent);
        if (DISCONNECT_DEBUGGER_AFTER_CLICK_COORDINATE){ //TODO: find better workaround, dispatchMouseEvent stops work after somte time after enabling debugger
            await this._sleep(100)
            await this._disconnectDebuggerIfNeeded(debuggeeId)
            await this._sleep(100)
        }
    }

    async _scrollIntoViewIfNeeded(debuggeeId, selector, hrefRegex) {
        await this._executeScript(debuggeeId.tabId, { code: "document.querySelector(\"" + selector + "\").scrollIntoViewIfNeeded()" }, hrefRegex)
        await this._sleep(500)
    }

    async _click(debuggeeId, selector, isTrusted, hrefRegex, offset) {
        if (isTrusted) {
            await this._scrollIntoViewIfNeeded(debuggeeId, selector, hrefRegex)
            await this._sleep(100)
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

    async _exists(debuggeeId, selector, innerTextRegex, hrefRegex) {//TODO: fix
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
    async _waitPageLoad(debuggeeId, hrefRegex) {
        const pageLoadWaitTimout = 30000
        const delay = 100
        const repetitions = pageLoadWaitTimout / delay
        return new Promise((resolve, reject) => {
            var clearInterval = this._setIntervalX(delay, repetitions,
                () => {
                    this._executeScript(debuggeeId.tabId, { code: "document.readyState" }, hrefRegex)
                        .then((readyState) => {
                            if (readyState == "complete") {
                                clearInterval()
                                resolve()
                            }
                        })
                        .catch(print)
                },
                () => {
                    reject(new Error("Page not loaded hrefRegex: " + hrefRegex))
                }
            )
        })
    }

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
                    reject(new Error(`Element not exists. selector: "${selector}" innerTextRegex: "${innerTextRegex}" hrefRegex: "${hrefRegex}"`))
                }
            )
        })
    }

    _waitRequestInAdvance(urlRegex, isOnBeforeRequest){
        return new Promise((resolve, reject) => {
            this.logger.log("Clicker _waitRequestInAdvance urlRegex: " + urlRegex)
            this.requestListener.startInAdvance(urlRegex,isOnBeforeRequest)
            resolve()
        })
    }

    _waitRequest(urlRegex, isOnBeforeRequest, waitTimout) { //TODO: add waitRequest beforehand
        return new Promise((resolve, reject) => {
            let clearInterval = this._setIntervalX(waitTimout,1,() => {
                this.requestListener.stop()
                reject(new Error("Clicker: waitRequest timeout urlRegex: " + urlRegex))
            })

            this.logger.log("Clicker >>> waitRequest urlRegex: " + urlRegex)
            this.requestListener.start(urlRegex, isOnBeforeRequest, true, (url, body) => {
                clearInterval()
                this.logger.log("Clicker <<< waitRequest url: " + url)
                resolve({url:url,body:body})
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
            "waitPageLoad",
            "wait",
            "waitRequest",
            "waitRequestInAdvance"
        ]
    }

    //PUBLIC
    //TODO: add wait until page load
    //actions
    scrollIntoViewIfNeeded(params) {
        if (this._isString(params))
            params = { selector: params }
        return this._scrollIntoViewIfNeeded(this.currentTabDebuggeeId, params.selector, params.hrefRegex)
    }
    clickCoordinate(params) {
        return this._clickCoordinates(this.currentTabDebuggeeId, params.x, params.y)
    }
    async click(params) {
        if (this._isString(params))
            params = { selector: params }
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
    goBack() {
        return this._goBack(this.currentTabDebuggeeId)
    }
    //getters
    exists(params) {
        if (this._isString(params))
            params = { selector: params }
        return this._exists(this.currentTabDebuggeeId, params.selector, params.innerTextRegex, params.hrefRegex)
    }
    search(params) {
        if (this._isString(params))
            params = { regex: params }
        return this._search(this.currentTabDebuggeeId, params.regex, params.hrefRegex)
    }
    calculateOffset(selectorsInfo) {
        return this._calculateOffset(this.currentTabDebuggeeId, selectorsInfo)
    }
    //others
    executeScript(params) {
        if (this._isString(params))
            params = { code: params }
        return this._executeScript(this.currentTabDebuggeeId.tabId, { code: params.code }, params.hrefRegex)
    }
    sleep(time) {
        return this._sleep(time)
    }
    async waitPageLoad(hrefRegex) {
        await this._waitPageLoad(this.currentTabDebuggeeId, hrefRegex)
        await this.sleep(50)
    }
    wait(params) {
        if (this._isString(params))
            params = { selector: params }
        return this._wait(this.currentTabDebuggeeId, params.selector, params.innerTextRegex, params.waitTimout, params.hrefRegex)
    }
    waitRequestInAdvance(params){
        this._waitRequestInAdvance(params.urlRegex, params.isOnBeforeRequest)
    }
    waitRequest(params) {
        if (params.isOnBeforeRequest == null)
            params.isOnBeforeRequest = false
        return this._waitRequest(params.urlRegex, params.isOnBeforeRequest, params.waitTimout)
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