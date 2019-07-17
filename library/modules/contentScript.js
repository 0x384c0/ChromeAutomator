
function init() {
    console.log("Content Script: init onMessage window.location.href: " + window.location.href)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Content Script: onMessage request.action: " + request.action + " window.location.href: " + window.location.href)
        switch (request.action) {
            case "executeScript":
                console.log("Content Script: executeScript new RegExp(\"" + request.hrefRegex + "\").test(\"" + window.location.href + "\")")
                if (new RegExp(request.hrefRegex).test(window.location.href)) {
                    console.log("Content Script: executeScript request.code: " + request.code)
                    let result = null
                    try {
                        result = eval(request.code)
                    } catch (error) {
                        result = error
                    }
                    sendResponse(result)
                }
                break;
            default:
                sendResponse("Unknown command")
                break;
        }
    }
    )
}

init()