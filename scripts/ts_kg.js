setFileName("download.sh")
let pageLoadingWaitTime = 1500
let seasonsLinkSelectors = executeScript({ code: "[...document.querySelectorAll(\"a.episode\")].map((el) => el.id)" })
seasonsLinkSelectors = seasonsLinkSelectors.map(id => "#" + id)
log("Found " + seasonsLinkSelectors.length + " seasons")

for ([i, elId] of seasonsLinkSelectors.entries()) {
    click({ selector: elId })
    sleep(pageLoadingWaitTime)
    click({ selector: "#download-button" })
    sleep(pageLoadingWaitTime)
    const fileUrl = executeScript({ code: "document.querySelector(\"#dl-button > a\").href" })
    wget(fileUrl,i + ".mp4")
    goBack()
    sleep(pageLoadingWaitTime)
    goBack()
    sleep(pageLoadingWaitTime)
}