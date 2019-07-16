//Request listener
class RequestListener {
  //public
  constructor(handler) {
    this._handler = handler
    this._isListening = false
  }
  setRegex(regex) {
    this.regex = new RegExp(regex)
  }
  start(regex) {
    this.setRegex(regex)
    if (!this._isListening) {
      this._isListening = true
      let instance = this
      chrome.devtools.network.onRequestFinished.addListener(response => {
        this._onRequestFinished(response)
      });
    }
  }
  stop() {
    if (this._isListening) {
      this._isListening = false
      chrome.devtools.network.onRequestFinished.removeListener(this._onRequestFinished);
    }
  }

  //private
  _onRequestFinished(request) {
    request.getContent((body) => {
      if (request.request && request.request.url && this.regex.test(request.request.url)) {
        this._handler(request.request.url, body)
      }
    });
  }
}

// init
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
  message_element.message += "Loading tab ...\n"
  chrome.tabs.query({ active: true, currentWindow: true }, tabCallback)
}

//Callbacks
function tabCallback(tabs) {
  message_element.text += "Tab id: " + tabs[0].id + "\n"
  chrome.runtime.sendMessage({ command: "start", targetTab: tabs[0] }, function (response) {
    message_element.text += response.message + "\n"
  });
}