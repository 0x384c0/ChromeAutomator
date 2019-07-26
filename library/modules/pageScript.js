function console_log(obj) {
    console.log(obj)
}

function init() {
    //Listen for runtime message
    // console_log("Page Script: init addEventListener window.location.href: " + window.location.href)
    window.addEventListener('executeScript', event => {
        console_log("Page Script >>> executeScript code: " + event.detail.code)
        let result = null
        try {
            result = eval(event.detail.code)
        } catch (error) {
            result = error
        }

        console_log("Page Script <<< executeScript result: " + result)
        let resultEvent = new CustomEvent('executeScriptResult', { detail: { result: result } });
        window.dispatchEvent(resultEvent);
    }, false);
}
init();