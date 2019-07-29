//constants
const defaultScript = "anime_365.js"

//logs
const logger = new Logger()

// utils
const requestListener = new RequestListener()
const clicker = new Clicker(requestListener)

//UI Binding
Vue.use(VueMaterial.default)
const app = new Vue({
    el: '#app',
    data: {
        script: defaultScript,
        is_working: false
    },
    methods: {
        start: start,
        reload: () => { location.reload() }
    }
})
let editor = null


//UI Actions
function start() {
    logger.info("start")
    showStart()
    const code = editor.getValue()
    try {
        eval("clicker.start(chrome.devtools.inspectedWindow.tabId, async clicker => {" + code + ";hideStart()})")
    } catch (e) {
        const err = e.constructor('Error: ' + e.message + "\nlineNumber: " + e.lineNumber)
        // +3 because `err` has the line number of the `eval` line plus two.
        err.lineNumber = e.lineNumber - err.lineNumber + 3
        throw err;
    }
}

//others
function showStart() {
    app.is_working = true
}
function hideStart() {
    app.is_working = false
}

//function editor
initEditor()
async function initEditor() {
    require.config({ paths: { 'vs': '../../library/external/monaco-editor/min/vs' } });
    monaco.editor.defineTheme('vs-dark-transparent', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            "editor.background": '#00000000',
            'editor.lineHighlightBackground': '#FFFFFF20',
        }
    })
    editor = monaco.editor.create(document.getElementById('container'), {
        language: 'javascript',
        theme: 'vs-dark-transparent',
        automaticLayout: true
    })
    loadScript(chrome.extension.getURL("/scripts/" + app.script))
}
function loadScript(url) {
    logger.info("Loading script url: " + url)
    fetch(url)
        .then(response => response.text())
        .then(text => editor.setValue(text))
        .then(() => logger.info("Loaded script url: " + url))
}