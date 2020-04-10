import ClipboardJS from 'clipboard'
// 赋值粘贴板
export const copyFunc = className => {
  let clipboard = new ClipboardJS(className)
  clipboard.on('success', function (e) {
    console.info('Action:', e.action)
    console.info('Text:', e.text)
    console.info('Trigger:', e.trigger)
    e.clearSelection()
  })
  clipboard.on('error', function (e) {
    console.error('Action:', e.action)
    console.error('Trigger:', e.trigger)
  })
}
// ---------
copyFunc('.copyText')
