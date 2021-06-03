
function listener(details) {

  var postedString = decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes)));
  console.log(new TextDecoder().decode(new Uint8Array(details.requestBody.raw[0].bytes)))
  // console.log(details)
  // let filter = browser.webRequest.filterResponseData(details.requestId);
  // let decoder = new TextDecoder("utf-8");
  // let encoder = new TextEncoder();

  // filter.ondata = event => {
  //   let str = decoder.decode(event.data, {stream: true});
  //   // Just change any instance of Example in the HTTP response
  //   // to WebExtension Example.
  //   str = str.replace(/Example/g, 'WebExtension Example');
  //   filter.write(encoder.encode(str));
  //   filter.disconnect();
  // }

  // return {};
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: ["https://old.zakupki.mos.ru/api/Cssp/Sku/*"]},
  // {urls: ["https://old.zakupki.mos.ru/*"], types: ["main_frame"]},
  ["blocking", "requestBody"]
);