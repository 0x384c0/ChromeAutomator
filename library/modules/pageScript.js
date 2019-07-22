function init() {
    //Listen for runtime message
    // console.log("Page Script: init addEventListener window.location.href: " + window.location.href)
    window.addEventListener('executeScript', event => {
        console.log("Page Script >>> executeScript code: " + event.detail.code)
        let result = null
        try {
            result = eval(event.detail.code)
        } catch (error) {
            result = error
        }

        console.log("Page Script <<< executeScript result: " + result)
        let resultEvent = new CustomEvent('executeScriptResult', { detail: { result: result } });
        window.dispatchEvent(resultEvent);
    }, false);
}
init();