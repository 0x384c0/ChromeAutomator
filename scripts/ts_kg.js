setFileName("download.sh")
let pageLoadingWaitTime = 1500
let seasonsLinkSelectors = executeScript({ code: "[...document.querySelectorAll(\"a.episode\")].map((el) => el.id)" })
seasonsLinkSelectors = seasonsLinkSelectors.map(id => "#" + id)
log("Found " + seasonsLinkSelectors.length + " seasons")

for ([i, elId] of seasonsLinkSelectors.entries()) {
    click({ selector: elId })
    waitPageLoad()
    click({ selector: "#download-button" })
    waitPageLoad()
    const fileUrl = executeScript({ code: "document.querySelector(\"#dl-button > a\").href" })
    wget(fileUrl,i + ".mp4")
    goBack()
    waitPageLoad()
    goBack()
    waitPageLoad()
}