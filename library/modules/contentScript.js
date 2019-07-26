function console_log(obj) {
    // console.log(obj)
}

class ContentScript {

    injectScript(file) {
        var th = (document.head || document.documentElement);
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', chrome.extension.getURL(file));
        th.appendChild(s);
        s.parentNode.removeChild(s);
    }

    evalCodeInPage(code, sendResponse) {
        console_log("Content Script >>> executeScript code: " + code)
        window.addEventListener('executeScriptResult',
            function receiveResult(event) {
                //Remove this listener, but you can keep it depend on your case
                window.removeEventListener('executeScriptResult', receiveResult, false);
                try {
                    console_log("Content Script <<< executeScript event.detail.result: " + event.detail.result)
                    sendResponse(event.detail.result)
                } catch (e) {
                    console_log("Content Script <<< executeScript e: " + e)
                    sendResponse(e)
                }

            }, false);

        let pageEvent = new CustomEvent('executeScript', { detail: { code: code } });
        window.dispatchEvent(pageEvent);
    }

    constructor() {
        this.injectScript('library/modules/pageScript.js');

        //Listen for runtime message
        // console_log("Content Script: init onMessage window.location.href: " + window.location.href)
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case "executeScript":
                    if (new RegExp(request.hrefRegex).test(window.location.href)) {
                        this.evalCodeInPage(request.code, sendResponse)
                    } else {
                        console_log("executeScript rejected location.href: " + window.location.href + " request.hrefRegex: " + request.hrefRegex)
                    }
                    break;
                default:
                    sendResponse("Unknown command")
                    break;
            }
        }
        )

    }

}

let contentScript = new ContentScript()