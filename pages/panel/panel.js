// utils
let clicker = new Clicker(async clicker => {
  console.log("Started")
  let iframeUrl = "^https://anime-365.ru/promo/embed"
  // let rect = await clicker.currentTab_executeScript("document.querySelector(\"div[class='skip-button']\").getBoundingClientRect()",iframeUrl)
  // console.log(rect)

  // await clicker.currentTab_click("div[class='vjs-play-control vjs-control ']");
  await clicker.currentTab_waitAndClick("div[class='skip-button']", "Пропустить рекламу(?! \\()", 25000, iframeUrl);
  console.log("Finished");
})
let requestListener = new RequestListener(
  (url, body) => { request_logs_element.text += url + "\n" }
)

//UI Binding
var message_element = new Vue({ el: '#message_element', data: { text: 'null\n' } })
var start_button = new Vue({ el: '#start_button', methods: { click: start } })

var regex_input = new Vue({ el: '#regex_input', data: { text: '.*' }, watch: { text: (newText, oldText) => { requestListener.setRegex(newText) } } })
var start_listening_button = new Vue({ el: '#start_listening_button', methods: { click: () => { requestListener.start(regex_input.text) } } })
var stop_listening_button = new Vue({ el: '#stop_listening_button', methods: { click: () => { requestListener.stop() } } })
var request_logs_element = new Vue({ el: '#request_logs_element', data: { text: 'null\n' } })

//UI Actions
function start() {
  console.log("start")
  message_element.message += "Loading tab ...\n"
  chrome.tabs.query({ active: true, currentWindow: true }, tabCallback)
}

//Callbacks
function tabCallback(tabs) {
  message_element.text += "Tab id: " + tabs[0].id + "\n"
  clicker.start(tabs[0])
}