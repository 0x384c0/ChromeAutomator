//logs
let logger = new Logger()

// utils
let requestListener = new RequestListener()
let clicker = new Clicker(requestListener)

//UI Binding
var message_element = new Vue({ el: '#message_element', data: { text: 'null\n' } })
var start_button = new Vue({ el: '#start_button', methods: { click: start } })

var coordinates = new Vue({ el: "#coordinates", data: { x: 0, y: 0 } })
var click_coordinates = new Vue({ el: '#click_coordinates', methods: { click: clickCoordinates } })


//UI Actions
function start() {
    logger.info("start")
    const code = editor.getValue()
    try {
        eval("clicker.start(chrome.devtools.inspectedWindow.tabId, async clicker => {" + code + "})")
    } catch (e) {
        const err = e.constructor('Error: ' + e.message + "\nlineNumber: " + e.lineNumber)
        // +3 because `err` has the line number of the `eval` line plus two.
        err.lineNumber = e.lineNumber - err.lineNumber + 3
        throw err;
    }
}

function clickCoordinates() {
    let clickTaskHandler = async (clicker) => {
        await clicker.clickCoordinate({ x: coordinates.x, y: coordinates.y })
    }
    logger.info("clickCoordinates")
    clicker.start(chrome.devtools.inspectedWindow.tabId, clickTaskHandler)
}

//function editor
let editor = null
initEditor()
async function initEditor() {
    require.config({ paths: { 'vs': '../../library/external/monaco-editor/min/vs' } });

    editor = monaco.editor.create(document.getElementById('container'), {
        language: 'javascript',
        theme: 'vs-dark'
    })
    loadScript(chrome.extension.getURL("/scripts/anime_365.js"))
}
function loadScript(url) {
    logger.info("Loading script url: " + url)
    fetch(url)
        .then(response => response.text())
        .then(text => editor.setValue(text))
        .then(() => logger.info("Loaded script url: " + url))
}