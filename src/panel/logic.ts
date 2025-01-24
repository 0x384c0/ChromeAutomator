import { onMounted } from 'vue';
import * as monaco from 'monaco-editor';
import { usePrimeVue } from 'primevue/config';


export function setupLogic() {
    onMounted(() => {
        initEditor();
    });

    return {
        isWorking: false,
        isStopping: false,
        selectedScriptTemplate: scriptTemplates[0].value,
        scriptTemplates: scriptTemplates,
        isHighlighCurrentLine: false,
        outputText: 'Example output code\n'.repeat(50),
        clearOutputText: () => {
            console.log('clearOutputText')
        },
        isHighlighCurrentLineChange: (event: Event) => {
            const checkbox = event.target as HTMLInputElement;
            const isChecked = checkbox.checked;
            console.log('isHighlighCurrentLineChange:', isChecked);
        },
        start: () => {
            console.log('start')
        },
        stop: () => {
            console.log('stop')
        },
        restart: () => {
            console.log('restart')
        }
    };
}

// // utils
// const requestListener = new RequestListener()
// const clicker = new Clicker(requestListener, onError)

// //UI Binding
// const app = new Vue({
//     el: '#app',
//     data: {
//         selectedScript: "",
//         selectScriptOptions: scriptsInfo,
//         is_working: false,
//         is_stopping: false,
//         output: "",
//         logs: "",
//         save_filename: "text.txt",
//         isHighlighCurrentLine: false
//     },
//     methods: {
//         start: start,
//         stop: stop,
//         reloadPage: reloadPage,
//         copy_output: copy_output,
//         save_output: save_output,
//         clear_output: clear_output,
//         didSelectedScript: (data) => {
//             loadScript(chrome.extension.getURL("/scripts/" + data))
//         }
//     }
// })
// let editor = null


// //UI Actions
// function reloadPage() {
//     sessionStorage.setItem("editor.value", editor.getValue())
//     location.reload()
// }

// function start() {
//     log("start")
//     hideStart()
//     const code = preprocessScript(editor.getValue())
//     try {
//         eval("clicker.start(chrome.devtools.inspectedWindow.tabId, async clicker => {" +
//             code + ";" +
//             "showStart();" +
//             "willExecuteScriptAtLine(lastLine, \"complete\")})")
//     } catch (e) {
//         const err = e.constructor('Error: ' + e.message + "\nlineNumber: " + e.lineNumber)
//         // +3 because `err` has the line number of the `eval` line plus two.
//         err.lineNumber = e.lineNumber - err.lineNumber + 3
//         if (err.lineNumber == null)
//             err.lineNumber = 0
//         onError(err)
//         throw err;
//     }
// }
// function stop() {
//     log("Stopping")
//     isNeedStop = true
//     app.is_stopping = true
// }

// function copy_output() {
//     window.getSelection().selectAllChildren(document.getElementById("output"));
//     document.execCommand("copy");
// }

// function save_output() {
//     var file = new File([app.output], app.save_filename, { type: "text/plain;charset=utf-8" });
//     saveAs(file);
// }

// function clear_output() {
//     clearOutput()
// }

// //others
// function hideStart() {
//     app.is_working = true
// }
// function showStart() {
//     app.is_working = false
//     app.is_stopping = false
// }
// function setFileName(filename) {
//     app.save_filename = filename
// }
// function onError(e) {
//     willExecuteScriptAtLine(lastLine, "error")
//     showStart()
//     log("\n\tERROR: " + e.message)
// }

// //async utils for unsing in preprocessor
// async function forEachAsync(array, callback) {
//     for (let index = 0; index < array.length; index++) {
//       await callback(array[index], index, array);
//     }
// }

// //preprocessor
// function preprocessScript(code) {
//     lastLine = 0
//     return code
//         .split(/\r?\n/)
//         .map(preprocessScriptLine)
//         .join("\n")
// }
// let shouldLogNextLine = true
// function preprocessScriptLine(line, index) {
//     let result = line
//     if (app.isHighlighCurrentLine){//TODO: improve parser perfomance
//         let hasIf = /^\s*if\s*\(.*\)\s*$/.test(line)
//         let hasElse = /^\s*}*\s*else\s*$/.test(line)
//         let hasElseIf = /^\s*}*\s*else\s*if\s*\(.*\)\s*$/.test(line)
//         let isBlank = /^(\s|{|}|\s)*$/.test(line) || /^\s*\./.test(line)
//         let isFunction = /^\s*function\s*\w+\s*\(.*$/.test(line)
//         //TODO: add support for multiline statements
//         if (shouldLogNextLine && !hasElse && !hasElseIf && !isBlank && !isFunction)
//             result = "willExecuteScriptAtLine(" + index + ");" + line
//         //dont insert willExecuteScriptAtLine for one-line statements after if-else
//         shouldLogNextLine = !(hasIf || hasElse || hasElseIf)
//     }

//     let allowedInScriptMethodsNames = clicker.getAllowedInScriptMethodsNames()
//     //clicker functions ruleToFindAndReplace
//     let rulesToFindAndReplace = allowedInScriptMethodsNames
//         .map(name => {
//             const searchValue = "\\b" + name + "\\("
//             return {
//                 searchValueRegEx: new RegExp(searchValue),
//                 newValue: "await clicker." + name + "(",
//                 searchRegEx: new RegExp(searchValue + ".*\\)")
//             }
//         })
//     //forEachAsync ruleToFindAndReplace
//     rulesToFindAndReplace.push({
//         searchValueRegEx: /(\w+)\.forEach\s*\(/,
//         newValue: "await forEachAsync($1,async ",
//         searchRegEx: /\.forEach\s*\(.*\s*=>\s*{\s*/
//     })
//     for (method of rulesToFindAndReplace) {
//         if (method.searchRegEx.test(result)) {
//             result = result.replace(method.searchValueRegEx, method.newValue)
//             break
//         }
//     }
//     return result;
// }

// // highligh current line
// let isNeedStop = false
// let decorations = [];
// let lastLine = null;
// function willExecuteScriptAtLine(lineIndex, type) {
//     let className = 'current_row_decoration'
//     if (type == "error")
//         className = 'current_row_decoration_error'
//     else if (type == "complete")
//         className = 'current_row_decoration_complete'
//     lineIndex++;
//     decorations = editor.deltaDecorations(decorations, [
//         { range: new monaco.Range(lineIndex, 1, lineIndex, 99), options: { isWholeLine: true, className: className, inlineClassName: className } },
//     ]);
//     editor.revealLineInCenter(lineIndex);
//     lastLine = lineIndex
//     if (isNeedStop) {
//         isNeedStop = false
//         throw Error("Stopped by user")
//     }
// }

// //logs and outputs
// const logger = new Logger()
// function log(obj) {
//     logger.info(obj)
//     app.logs += obj.toString() + "\n"
// }
// function output(text) {
//     app.output += text + "\n"
// }
// function clearOutput() {
//     app.output = ""
// }
// function wget(fileUrl, fileName) {
//     let fileNameParam = ""
//     if (fileName != null) {
//         fileNameParam = "-O \"" + fileName.replace(/[^A-zА-я0-9_-\s\.:]/g, '') + "\""
//     }
//     output("wget " + fileNameParam + " -c --retry-connrefused --tries=3 --timeout=5 \"" + fileUrl + "\"")
// }
// function ffmpeg(fileUrl, subtitlesUrl) {
//     let subtitlesParam = ""
//     if (subtitlesUrl != null) {
//         subtitlesParam = "-vf subtitles=filename=\"" + subtitlesUrl + "\""
//     }
//     output("ffplay " + subtitlesParam + "  -user-agent \"Mozilla/5.0\" -reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 2 \"" + fileUrl + "\"")
// }
// function m3u8Header() {
//     output("#EXTM3U")
// }
// function m3u8(fileUrl, fileName) {
//     output("#EXTINF:-1,\"" + fileName.replace(",", "_") + "\"")
//     output(fileUrl)
// }

// //function editor
// initEditor()


let editor: monaco.editor.IStandaloneCodeEditor;

async function initEditor() {

    const primevue = usePrimeVue()
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    monaco.editor.setTheme(isDarkTheme ? 'vs-dark' : 'vs-light');

    if (editor == undefined) {
        let element = document.getElementById('editor-container') as HTMLElement;
        editor = monaco.editor.create(element, {
            value: '// Example code \n'.repeat(50),
            language: 'javascript',
            automaticLayout: true
        });
    }

    const previousEditorValue = sessionStorage.getItem("editor.value")
    sessionStorage.removeItem("editor.value")
    if (previousEditorValue != null && previousEditorValue != "") {
        editor.setValue(previousEditorValue)
    } else {
        autoSelectTemplate()
    }
}



// //constants
const templateName = "template script"
const scriptTemplates = [
    { label: templateName, value: "template.js" },
    { label: "smotret-anime.online", value: "anime_365.js" },
    { label: "ts.kg", value: "ts_kg.js" },
    { label: "animespirit.ru", value: "animespirit.js" },
    { label: "animespirit.cc", value: "animespirit.js" },
]

function autoSelectTemplate() {
    chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
        const scriptsMap = {}
        for (let scriptInfo of scriptTemplates) {
            scriptsMap[scriptInfo.label] = scriptInfo.value
        }
        const pageUrl = tab.url
        if (pageUrl == null) return
        let key = Object.keys(scriptsMap).find(url => pageUrl.includes(url))
        if (key == null) {
            key = templateName
        }
        // app.selectedScript = scriptsMap[key]
    })
}

// function loadScript(url) {
//     if (url != null && url != "") {
//         log("Loading script url: " + url)
//         fetch(url)
//             .then(response => response.text())
//             .then(text => editor.setValue(text))
//     }
// }