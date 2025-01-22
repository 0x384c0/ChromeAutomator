export class PageInjector {
    isVerboseLogging: any;
    lastInspectedWindowExecuteScriptResult: any;
    console_log(obj: string) {
        if (this.isVerboseLogging)
            console.log(`Content Script: ${obj}`);
    }

    injectScript(file: string) {
        var th = (document.head || document.documentElement);
        if (this.isVerboseLogging) {
            let logFlag = document.createElement('script');
            logFlag.setAttribute('id', 'isVerboseLogging');
            th.appendChild(logFlag);
        }
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', chrome.runtime.getURL(file));
        th.appendChild(script);
        if (script.parentNode != null) script.parentNode.removeChild(script);
    }

    evalCodeInPage(code: string, sendResponse: { (response?: any): void; (arg0: any): void; }) {
        this.console_log(">>> executeScript code: " + code);
        window.addEventListener('evalCodeInPageResult',
            function receiveResult(event) {
                //Remove this listener, but you can keep it depend on your case
                window.removeEventListener('evalCodeInPageResult', receiveResult, false);
                try {
                    this.console_log("<<< executeScript event.detail.result: " + event.detail.result);
                    sendResponse(event.detail.result);
                } catch (e) {
                    this.console_log("<<< executeScript e: " + e);
                    sendResponse(e);
                }

            }, false);

        let pageEvent = new CustomEvent('executeScript', { detail: { code: code } });
        window.dispatchEvent(pageEvent);
    }


    constructor(storage: { getIsVerboseLogging: () => Promise<any>; }) {
        storage.getIsVerboseLogging()
            .then((isVerboseLogging: any) => {
                this.isVerboseLogging = isVerboseLogging;
                this.initialize();
            });
    }

    initialize() {
        this.console_log("init onMessage window.location.href: " + window.location.href);
        this.injectScript('/src/modules/pageScript.js'); // TODO: fix for manifest v3

        //Listen for runtime message
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case "executeScript": //unsafe eval is didnt work. Fidn anoher way
                    if (new RegExp(request.hrefRegex).test(window.location.href)) {
                        this.console_log("executeScript accepted location.href: " + window.location.href + " request.hrefRegex: " + request.hrefRegex);
                        this.evalCodeInPage(request.code, sendResponse);
                    } else {
                        this.console_log("executeScript rejected location.href: " + window.location.href + " request.hrefRegex: " + request.hrefRegex);
                    }
                    break;

                case "getFullUrl":
                    if (new RegExp(request.hrefRegex).test(window.location.href)) {
                        this.console_log("getFullUrl accepted location.href: " + window.location.href + " request.hrefRegex: " + request.hrefRegex);
                        sendResponse(window.location.href);
                    } else {
                        this.console_log("getFullUrl rejected location.href: " + window.location.href + " request.hrefRegex: " + request.hrefRegex);
                    }
                    break;

                case "getLastInspectedWindowExecuteScriptResult":
                    if (new RegExp(request.hrefRegex).test(window.location.href)) {
                        if (this.lastInspectedWindowExecuteScriptResult != null) {
                            this.console_log("getLastInspectedWindowExecuteScriptResult accepted location.href: " + window.location.href + " request.hrefRegex: " + request.hrefRegex);
                            sendResponse(this.lastInspectedWindowExecuteScriptResult.result);
                            this.lastInspectedWindowExecuteScriptResult = null;
                        }
                        else
                            sendResponse(new Error("lastInspectedWindowExecuteScriptResult is null"));
                    } else {
                        this.console_log("getLastInspectedWindowExecuteScriptResult rejected location.href: " + window.location.href + " request.hrefRegex: " + request.hrefRegex);
                    }
                    break;

                default:
                    sendResponse("Unknown command");
                    break;
            }
        }
        );
        window.addEventListener('inspectedWindowExecuteScriptResult', (event) => {
            this.lastInspectedWindowExecuteScriptResult = { result: event.detail.result };
        }, false);
    }
}
