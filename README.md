# ChromeScraper

Automated bot for web scraping. (Chrome extension)

## Build

- `npm install`
- `npm run dev`

## API

```
//panel
setFileName(filename)
log(obj)
output(text)
clearOutput()
wget(fileUrl, fileName)
ffmpeg(fileUrl, subtitlesUrl)
m3u8Header()
m3u8(fileUrl, fileName)

//actions
scrollIntoViewIfNeeded(selector)
scrollIntoViewIfNeeded({ selector: selector, hrefRegex: hrefRegex })
clickCoordinate(x, y)
click(selector)
click({ selector: selector, isTrusted: isTrusted, iframesSelectorInfo: [{ hrefRegex: hrefRegex, selector: selector }], hrefRegex: hrefRegex })
goBack()

//getters
exists(selector)
exists({ selector: selector, innerTextRegex: innerTextRegex, hrefRegex: hrefRegex })
search(regex)
search({ regex: regex, hrefRegex: hrefRegex })
calculateOffset([{ hrefRegex: hrefRegex, selector: selector }])

//others
executeScript(code)
executeScript({ code: code, hrefRegex: hrefRegex })
sleep(time)
waitPageLoad(hrefRegex)
wait(selector)
wait({ selector: selector, innerTextRegex: innerTextRegex, waitTimout: waitTimout, hrefRegex: hrefRegex })
waitRequestInAdvance(urlRegex)
waitRequest({ urlRegex: urlRegex, waitTimout: waitTimout })
```

### TODO:

- fix script execution for Manivest V3
- use webext-bridge