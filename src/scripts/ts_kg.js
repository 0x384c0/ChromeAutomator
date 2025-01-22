let pageLoadingWaitTime = 1500
let seasonsLinkSelectors = executeScript("[...document.querySelectorAll(\"a.episode\")].map((el) => el.id)")
let title = executeScript("document.querySelector(\"#h-show-title\").innerText")
seasonsLinkSelectors = seasonsLinkSelectors.map(id => "#" + id)
log("Found " + seasonsLinkSelectors.length + " seasons")

setFileName(title + ".m3u")
clearOutput()
m3u8Header()

for (elId of seasonsLinkSelectors) {
    click(elId)
    waitPageLoad()
    click("#download-button")
    waitPageLoad()
    const fileUrl = executeScript("document.querySelector(\"#dl-button > a\").href")
    const name = executeScript("document.querySelector(\"div.app-show-header-title-original > a\").innerText")
    m3u8(fileUrl, name)
    goBack()
    waitPageLoad()
    goBack()
    waitPageLoad()
}