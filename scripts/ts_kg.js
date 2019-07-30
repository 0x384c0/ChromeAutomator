setFileName("download.sh")
let pageLoadingWaitTime = 1500
let seasonsLinkSelectors = (await clicker.executeScript({ code: "[...document.querySelectorAll(\"a.episode\")].map((el) => el.id)" }))
seasonsLinkSelectors = seasonsLinkSelectors.map(id => "#" + id)
log("Found " + seasonsLinkSelectors.length + " seasons")

for ([i, elId] of seasonsLinkSelectors.entries()) {
    await clicker.click({ selector: elId })
    await clicker.sleep(pageLoadingWaitTime)
    await clicker.click({ selector: "#download-button" })
    await clicker.sleep(pageLoadingWaitTime)
    const fileUrl = await clicker.executeScript({ code: "document.querySelector(\"#dl-button > a\").href" })
    wget(fileUrl,i + ".mp4")
    await clicker.goBack()
    await clicker.sleep(pageLoadingWaitTime)
    await clicker.goBack()
    await clicker.sleep(pageLoadingWaitTime)
}