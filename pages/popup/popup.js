
var app = new Vue({
  el: '#app',
  data: {
    message: 'null\n'
  }
})

var test_button = new Vue({
  el: '#test_button',
  methods: {
    click: myFunction
  }
})

function myFunction() {
  app.message += "Loading tab ...\n"
  chrome.tabs.query({ active: true, currentWindow: true }, tabCallback)
}

function tabCallback(tabs) {
  app.message += "Tab id: " + tabs[0].id + "\n"
  chrome.runtime.sendMessage({ command: "start", targetTab: tabs[0] }, function (response) {
    app.message += response.message + "\n"
  });
}

var app6 = new Vue({
  el: '#app-6',
  data: {
    message: 'null'
  }
})
