const textarea = document.getElementById('filter')
const button = document.getElementById('copy')

// browser.runtime.onMessage.addListener(async data => {
//   if (data.type === 'filter') {
//     textarea.value = data.filter
//     textarea.select()
//     document.execCommand("copy")
//     // saveXl(data.filter)
//     // await fetchWithFilter(data.filter)
//     // alert('Скопировано в буфер')
//   }
// })

button.addEventListener('click', async () => {
  await browser.runtime.sendMessage({type: 'getFilter'})
})

async function fetchWithFilter(filter) {
  const response = await fetch(
    'https://old.zakupki.mos.ru/api/Cssp/Sku/PostQuery',
    {
      method: 'POST',
      body: JSON.stringify(filter)
    }
  )
  // console.log(response)
}

function saveXl(response) {
  console.log('ready to save xl')
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(response)
  XLSX.utils.book_append_sheet(wb, ws, 'ws_name')
  XLSX.writeFile(wb, "export.xlsx")
}