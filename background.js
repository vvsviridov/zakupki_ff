const zakupkiUrl = 'https://old.zakupki.mos.ru/api/Cssp/Sku'
const pageWaitingTimer = 600000
const delayTimerMin = 1
const delayTimerMax = 300000

var delayTimer = delayTimerMin

const queueFetch = []
const rows = []


var filter = null
var response = null
var responseStr = ''
var responseFilter = null


filterListen()


browser.runtime.onMessage.addListener(async data => {
  if (data.type === 'parse') {
    browser.webRequest.onBeforeRequest.removeListener(filterResponse)
    await parsingPages()
    await saveXl()
    filterListen()
    await browser.runtime.sendMessage({type: 'enable'})
  }
})


function filterListen() {
  browser.webRequest.onBeforeRequest.addListener(
    filterResponse,
    {urls: [`${zakupkiUrl}/PostQuery`]},
    ["requestBody", "blocking"]
  )
}


function filterResponse(details) {
  filter = JSON.parse(new TextDecoder().decode(new Uint8Array(details.requestBody.raw[0].bytes)))
  responseFilter = browser.webRequest.filterResponseData(details.requestId)
  let decoder = new TextDecoder("utf-8")
  responseFilter.ondata = event => {
    responseStr += decoder.decode(event.data, {stream: true})
    responseFilter.write(event.data)
  }
  responseFilter.onstop = () => {
    response = JSON.parse(responseStr)
    responseStr = ''
    responseFilter.disconnect()
    // console.log(responseStr)
  }
}


async function parsingPages() {
  queueFetch.length = 0
  while (response.count >= filter.skip + +filter.take) {
    filter.skip = filter.skip + +filter.take
    filter.take = "50"
    queueFetch.push({skip: filter.skip, take: filter.take})
  }
  await fetchPage()
}


function fetchPage() {
  return new Promise((resolve, reject) => {
    if (queueFetch.length > 0) {
      const rejectTimeout = setTimeout(() => reject(
        new Error('Истекло время ожидания страницы: ' + JSON.stringify(filter))
      ), pageWaitingTimer)
      const { skip, take } = queueFetch.pop()
      filter.skip = skip
      filter.take = take
      const fetchTimeout = setTimeout(async () => {
        const res = await fetch(`${zakupkiUrl}/PostQuery`, {
          method: 'POST',
          body: JSON.stringify(filter),
          headers: {
            "Content-Type": "application/json;charset=utf-8"
          }
        })
        if (res.status === 200) {
          clearTimeout(rejectTimeout)
          clearTimeout(fetchTimeout)
          resJson = await res.json()
          response.items = response.items.concat(resJson.items)
          delayTimer = delayTimerMin
          await fetchPage()
          resolve()
        } else {
          queueFetch.push({skip, take})
          delayTimer = delayTimerMax
          await fetchPage()
          resolve()
        }
      }, delayTimer)
    } else {
      resolve()
    }
    // resolve()
  })
}


async function saveXl() {
  const wb = XLSX.utils.book_new()
  const { items } = response
  queueFetch.length = 0
  items.forEach(item => queueFetch.push(item))
  await getItemEntity()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, filter.filter.keyword)
  XLSX.writeFile(wb, `parsed_${filter.filter.keyword}.xlsx`)
}


function getItemEntity() {
  return new Promise((resolve, reject) => {
    if (queueFetch.length > 0) {
      item = queueFetch.pop()
      const rejectTimeout = setTimeout(() => reject(
        new Error(`Истекло время ожидания свойств: ${item.id}`)
      ), pageWaitingTimer)
      const fetchTimeout = setTimeout(async () => {
        const res = await fetch(`${zakupkiUrl}/GetEntity?id=${item.id}`)
        if (res.status === 200) {
          clearTimeout(rejectTimeout)
          clearTimeout(fetchTimeout)
          const entity = await res.json()
          const { minPrice, maxPrice, medianPrice, skuCharacteristics } = entity
          const price = {
            'Минимальная цена': minPrice,
            'Максимальная цена': maxPrice,
            'Средняя цена': medianPrice,
          }
          let characteristics = {}
          skuCharacteristics.map(item => {
            if (item.characteristicValueBoolValue !== null) {
              var characteristicValueBoolValue = item.characteristicValueBoolValue ? "Да" : "Нет"
            }
            let charName = item.productCharacteristicValue.productCharacteristicName
            let charValue = characteristicValueBoolValue || item.characteristicValueDateTimeValue || item.characteristicValueDecimalValue || item.characteristicValueIntValue || item.characteristicValueStringValue
            characteristics = {
              ...characteristics,
              [charName]: charValue
            }
          })
          rows.push({
            'Ключевое слово': filter.filter.keyword,
            'Наименование': item.name,
            'ID СТЕ': item.id,
            ...price,
            'Количество предложений': item.offersCount,
            'КПГЗ': `${item.productionCode} - ${item.productionDirectoryName.toUpperCase()}`,
            'Востребованная продукция': item.isDemanded ? 'Да' : 'Нет',
            ...characteristics
          })
          delayTimer = delayTimerMin
          await getItemEntity()
          resolve()
        } else {
          queueFetch.push(item)
          delayTimer = delayTimerMax
          await getItemEntity()
          resolve()
        }
      }, delayTimer)
    } else {
      resolve()
    }
    // resolve()
  })
}