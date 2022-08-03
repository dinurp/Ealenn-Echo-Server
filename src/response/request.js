const config = require('../nconf');
const decode = require("jwt-decode");

module.exports = (req) => {
  if (config.get('enable:request')) {
    const isCookiesEnabled = config.get('enable:cookies');
    if (!isCookiesEnabled) {
      delete req.headers["cookie"];
    }

    const more = {};
    if (config.get('enable:decodejwt') && req.headers.authorization ) {
      const [s,t] = req.headers.authorization.split(" ");
      if( s?.toLowerCase() == "bearer" && t){
        try{
          more.jwt = {
            header: decode(t,{header:true}),
            body: decode(t)
          };
        }catch(_){ }
      }
    }

    return {
      ...more,
      params: req.params,
      query: req.query,
      cookies: isCookiesEnabled ? req.cookies : [],
      body: req.body,
      headers: sanitize(req.headers),
      files: req.files?.map( f => {
          return {
            name: f.fieldname,
            filename: f.originalname,
            encoding: f.encoding,
            mimetype: f.mimetype,
            size: f.size,
            content: f.buffer.toString(
              f.encoding == '7bit' ? 'ascii': 'base64' 
            )
          }
      })
    };
  } else {
    return undefined
  }
}

function sanitize(inHeaders) {
  const headers = {}
  Object.keys(inHeaders)
    .filter(  k => 
      !k?.match(
        /authorization|x-b3-*|x-b3-*|x-cf-*|x-scp-*|x-vcap-*/
      )
    )
    .forEach( k => headers[k] = inHeaders[k] )
    if (inHeaders.authorization){
      [s,c] = inHeaders.authorization.split(" ")
      headers.authorization = `${s} --`
    }
  return headers;
}
