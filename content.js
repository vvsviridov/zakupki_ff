browser.runtime.onMessage.addListener(data => {
  if (data.type === 'filter') {
    // textarea.value = data.filter
    // textarea.select()
    // document.execCommand("copy")
    saveXl(data.filter)
    // await fetchWithFilter(data.filter)
    // alert('Скопировано в буфер')
  }
})

function saveXl(response) {
  console.log('ready to save xl')
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(response)
  XLSX.utils.book_append_sheet(wb, ws, 'ws_name')
  XLSX.writeFile(wb, "export.xlsx")
}