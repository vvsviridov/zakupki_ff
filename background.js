var filter = ''
var response = ''

// https://github.com/SheetJS/sheetjs/blob/master/demos/chrome/table.js

browser.runtime.onMessage.addListener(async data => {
  if (data.type === 'getFilter') {
    await browser.runtime.sendMessage({type: 'filter', filter: response})
    // saveXl()
  }
})

function listener(details) {
  filter = new TextDecoder().decode(new Uint8Array(details.requestBody.raw[0].bytes))

  let responseFilter = browser.webRequest.filterResponseData(details.requestId)
  let decoder = new TextDecoder("utf-8")
  responseFilter.ondata = event => {
    response += decoder.decode(event.data, {stream: true})
  }
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: ["https://old.zakupki.mos.ru/api/Cssp/Sku/PostQuery"]},
  ["requestBody", "blocking"]
)

function saveXl() {
  console.log('ready to save xl')
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(response)
  XLSX.utils.book_append_sheet(wb, ws, 'ws_name')
  XLSX.writeFile(wb, "export.xlsx")
}