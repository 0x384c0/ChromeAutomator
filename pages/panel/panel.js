//constants
const templateName = "template script"
const scriptsInfo = [
    { text: templateName, value: "template.js" },
    { text: "smotret-anime-365.ru", value: "anime_365.js" },
    { text: "ts.kg", value: "ts_kg.js" },
]

// utils
const requestListener = new RequestListener()
const clicker = new Clicker(requestListener, onError)

//UI Binding
Vue.use(VueMaterial.default)
const app = new Vue({
    el: '#app',
    data: {
        selectedScript: "",
        selectScriptOptions: scriptsInfo,
        is_working: false,
        is_stopping: false,
        output: "",
        logs: "",
        save_filename: "text.txt"
    },
    methods: {
        start: start,
        stop: stop,
        reloadPage: reloadPage,
        copy_output: copy_output,
        save_output: save_output,
        clear_output: clear_output,
        didSelectedScript: (data) => {
            loadScript(chrome.extension.getURL("/scripts/" + data))
        }
    }
})
let editor = null


//UI Actions
function reloadPage() {
    sessionStorage.setItem("editor.value", editor.getValue())
    location.reload()
}

function start() {
    log("start")
    hideStart()
    const code = preprocessScript(editor.getValue())
    try {
        eval("clicker.start(chrome.devtools.inspectedWindow.tabId, async clicker => {" +
            code + ";" +
            "showStart();" +
            "atExecuteScriptLine(lastLine, \"complete\")})")
    } catch (e) {
        const err = e.constructor('Error: ' + e.message + "\nlineNumber: " + e.lineNumber)
        // +3 because `err` has the line number of the `eval` line plus two.
        err.lineNumber = e.lineNumber - err.lineNumber + 3
        throw err;
    }
}
function stop() {
    log("Stopping")
    isNeedStop = true
    app.is_stopping = true
}

function copy_output() {
    window.getSelection().selectAllChildren(document.getElementById("output"));
    document.execCommand("copy");
}

function save_output() {
    var file = new File([app.output], app.save_filename, { type: "text/plain;charset=utf-8" });
    saveAs(file);
}

function clear_output() {
    clearOutput()
}

//others
function hideStart() {
    app.is_working = true
}
function showStart() {
    app.is_working = false
    app.is_stopping = false
}
function setFileName(filename) {
    app.save_filename = filename
}
function onError(e) {
    atExecuteScriptLine(lastLine, "error")
    showStart()
    log("\n\tERROR: " + e.message)
}


//preprocessor
function preprocessScript(code) {
    return code
        .split(/\r?\n/)
        .map(preprocessScriptLine)
        .join("\n")
}
function preprocessScriptLine(text, index) {
    let result = "atExecuteScriptLine(" + index + ");" + text
    let allowedInScriptMethodsNames = clicker.getAllowedInScriptMethodsNames()
    let methodsToFindAndReplace = allowedInScriptMethodsNames
        .map(name => {
            const searchValue = "\\b" + name + "\\("
            return {
                searchValueRegEx: new RegExp(searchValue),
                newValue: "await clicker." + name + "(",
                searchRegEx: new RegExp(searchValue + ".*\\)")
            }
        })
    for (method of methodsToFindAndReplace) {
        if (method.searchRegEx.test(result)) {
            result = result.replace(method.searchValueRegEx, method.newValue)
            break
        }
    }
    return result;
}

// highligh current line
let isNeedStop = false
let decorations = [];
let lastLine = null;
function atExecuteScriptLine(lineIndex, type) {
    let className = 'current_row_decoration'
    if (type == "error")
        className = 'current_row_decoration_error'
    else if (type == "complete")
        className = 'current_row_decoration_complete'
    lineIndex++;
    decorations = editor.deltaDecorations(decorations, [
        { range: new monaco.Range(lineIndex, 1, lineIndex, 99), options: { isWholeLine: true, className: className, inlineClassName: className } },
    ]);
    editor.revealLineInCenter(lineIndex);
    lastLine = lineIndex
    if (isNeedStop) {
        isNeedStop = false
        throw Error("Stopped by user")
    }
}

//logs and outputs
const logger = new Logger()
function log(obj) {
    logger.info(obj)
    app.logs += obj.toString() + "\n"
}
function output(text) {
    app.output += text + "\n"
}
function clearOutput() {
    app.output = ""
}
function wget(fileUrl, fileName) {
    let fileNameParam = ""
    if (fileName != null) {
        fileNameParam = "-O \"" + fileName.replace(/[^A-zА-я0-9_-\s\.:]/g, '') + "\""
    }
    output("wget " + fileNameParam + " -c --retry-connrefused --tries=3 --timeout=5 \"" + fileUrl + "\"")
}
function ffmpeg(fileUrl, subtitlesUrl) {
    let subtitlesParam = ""
    if (subtitlesUrl != null) {
        subtitlesParam = "-vf subtitles=filename=\"" + subtitlesUrl + "\""
    }
    output("ffplay " + subtitlesParam + "  -user-agent \"Mozilla/5.0\" -reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 2 \"" + fileUrl + "\"")
}
function m3u8Header() {
    output("#EXTM3U")
}
function m3u8(fileUrl, fileName) {
    output("#EXTINF:-1,\"" + fileName.replace(",", "_") + "\"")
    output(fileUrl)
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

    const previousEditorValue = sessionStorage.getItem("editor.value")
    sessionStorage.removeItem("editor.value")
    if (previousEditorValue != null && previousEditorValue != "") {
        editor.setValue(previousEditorValue)
    } else {
        chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
            const scriptsMap = {}
            for (scriptInfo of scriptsInfo) {
                scriptsMap[scriptInfo.text] = scriptInfo.value
            }
            const pageUrl = tab.url
            let key = Object.keys(scriptsMap).find(url => pageUrl.includes(url))
            if (key == null) {
                key = templateName
            }
            app.selectedScript = scriptsMap[key]
        })
    }
}
function loadScript(url) {
    if (url != null && url != "") {
        log("Loading script url: " + url)
        fetch(url)
            .then(response => response.text())
            .then(text => editor.setValue(text))
    }
}