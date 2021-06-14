const button = document.getElementById('parsing')


button.addEventListener('click', async () => {
  try {
    button.disabled = true
    await browser.runtime.sendMessage({type: 'parse'})
  } catch (error) {
    console.error(error)
    button.disabled = false
  }
})


browser.runtime.onMessage.addListener(async data => {
  if (data.type === 'enable') {
    button.disabled = false
  }
})