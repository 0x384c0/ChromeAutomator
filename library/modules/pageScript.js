function console_log(obj) {
    if (document.querySelector("script#isVerboseLogging")!= null)
        console.log(`Page Script: ${obj}`)
}

//TODO: find frame by ursl regex
function init() {
    //Listen for runtime message
    console_log("init addEventListener window.location.href: " + window.location.href)
    window.addEventListener('executeScript', event => {
        console_log(">>> executeScript code: " + event.detail.code)
        let result = null
        try {
            result = new Error("unsafe eval is didnt work")// eval(event.detail.code) //unsafe eval is didnt work. Fidn anoher way
        } catch (error) {
            result = error
        }

        console_log("<<< executeScript result: " + result)
        let resultEvent = new CustomEvent('evalCodeInPageResult', { detail: { result: result } });
        window.dispatchEvent(resultEvent);
    }, false);
}
init();