//constants
const defaultScript = "anime_365.js"

//logs and outputs
const logger = new Logger()
function log(obj) {
    logger.info(obj)
    app.logs += obj.toString() + "\n"
}
function output(text) {
    app.output += text + "\n"
}
function wget(fileUrl, fileName) {
    let fileNameParam = ""
    if (fileName != null) {
        fileNameParam = "-O \"" + fileName.replace(/[^A-zА-я0-9_-\s\.:]/g,'') + "\""
    }
    output("wget " + fileNameParam + " -c --retry-connrefused --tries=3 --timeout=5 \"" + fileUrl + "\"")
}
function ffmpeg(videoUrl, subtitlesUrl) {
    let subtitlesParam = ""
    if (subtitlesUrl != null) {
        subtitlesParam = "-vf subtitles=filename=\"" + subtitlesUrl + "\""
    }
    output("ffplay " + subtitlesParam + "  -user-agent \"Mozilla/5.0\" -reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 2 \"" + videoUrl + "\"")
}

// utils
const requestListener = new RequestListener()
const clicker = new Clicker(requestListener,onError)

//UI Binding
Vue.use(VueMaterial.default)
const app = new Vue({
    el: '#app',
    data: {
        script: defaultScript,
        is_working: false,
        output: "",
        logs: "",
        save_filename: "text.txt"
    },
    methods: {
        start: start,
        reload: () => { location.reload() },
        copy: copy,
        save: save
    }
})
let editor = null


//UI Actions
function start() {
    log("start")
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

function copy() {
    window.getSelection().selectAllChildren(document.getElementById("output"));
    document.execCommand("copy");
}

function save() {
    var file = new File([app.output], app.save_filename, { type: "text/plain;charset=utf-8" });
    saveAs(file);
}

//others
function showStart() {
    app.is_working = true
}
function hideStart() {
    app.is_working = false
}
function setFileName(filename){
    app.save_filename = filename
}
function onError(e){
    showStart()
    log(e.message)
}

//function editor
initEditor()
async function initEditor() {
    require.config({ paths: { 'vs': '../../library/external/monaco-editor/min/vs' } });
    editor = monaco.editor.create(document.getElementById('container'), {
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true
    })
    loadScript(chrome.extension.getURL("/scripts/" + app.script))
}
function loadScript(url) {
    log("Loading script url: " + url)
    fetch(url)
        .then(response => response.text())
        .then(text => editor.setValue(text))
}