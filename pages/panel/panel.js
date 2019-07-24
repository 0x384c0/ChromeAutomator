// utils
let requestListener = new RequestListener()
let clicker = new Clicker(requestListener, async clicker => {
  console.log("Started")
  // let iframeUrl = "^https://anime-365.ru/promo/embed"
  // await clicker.currentTab_click("div[class='vjs-play-control vjs-control ']",false)
  // await clicker.sleep(1000)
  // await clicker.currentTab_wait("div[class='skip-button']", "Пропустить рекламу(?! \\()", 25000, iframeUrl)
  // await clicker.currentTab_executeScript("this.doSkip()", iframeUrl)
  // let body = await clicker.waitRequest("/translations/embedActivation", 25000)
  // console.log(JSON.parse(JSON.parse(body).sources)[0].urls[0])

  await clicker.currentTab_click("div > div.m-select-sibling-episode > a", true)

  // var urlRegex = "(https?:\/\/[^\s]+)";
  // let urls = await clicker.currentTab_search(urlRegex)
  // console.log(urls)

  // await clicker.currentTab_goBack()

  console.log("Finished");
})

//UI Binding
var message_element = new Vue({ el: '#message_element', data: { text: 'null\n' } })
var start_button = new Vue({ el: '#start_button', methods: { click: start } })

var coordinates = new Vue({ el: "#coordinates", data: { x: 0, y: 0 } })

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