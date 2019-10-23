function console_log(obj) {
    console.log(obj)
}

//TODO: find frame by ursl regex
function init() {
    //Listen for runtime message
    console_log("Page Script: init addEventListener window.location.href: " + window.location.href)
    window.addEventListener('executeScript', event => {
        console_log("Page Script >>> executeScript code: " + event.detail.code)
        let result = null
        try {
            result = new Error("unsafe eval is didnt work")// eval(event.detail.code) //unsafe eval is didnt work. Fidn anoher way
        } catch (error) {
            result = error
        }

        console_log("Page Script <<< executeScript result: " + result)
        let resultEvent = new CustomEvent('evalCodeInPageResult', { detail: { result: result } });
        window.dispatchEvent(resultEvent);
    }, false);
}
init();