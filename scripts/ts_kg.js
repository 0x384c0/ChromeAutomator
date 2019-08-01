let pageLoadingWaitTime = 1500
let seasonsLinkSelectors = executeScript({ code: "[...document.querySelectorAll(\"a.episode\")].map((el) => el.id)" })
let title = executeScript({ code: "document.querySelector(\"#h-show-title\").innerText" })
seasonsLinkSelectors = seasonsLinkSelectors.map(id => "#" + id)
log("Found " + seasonsLinkSelectors.length + " seasons")

setFileName(title + ".m3u")
clearOutput()
m3u8Header()

for (elId of seasonsLinkSelectors) {
    click({ selector: elId })
    waitPageLoad()
    click({ selector: "#download-button" })
    waitPageLoad()
    const fileUrl = executeScript({ code: "document.querySelector(\"#dl-button > a\").href" })
    const name = executeScript({code:"document.querySelector(\"div.app-show-header-title-original > a\").innerText"})
    m3u8(fileUrl, name)
    goBack()
    waitPageLoad()
    goBack()
    waitPageLoad()
}