'use strict';

var http = require('http');
var number = require('lib0/number');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var number__namespace = /*#__PURE__*/_interopNamespaceDefault(number);

const CALLBACK_URL = process.env.CALLBACK_URL ? new URL(process.env.CALLBACK_URL) : null;
const CALLBACK_TIMEOUT = number__namespace.parseInt(process.env.CALLBACK_TIMEOUT || '5000');
const CALLBACK_OBJECTS = process.env.CALLBACK_OBJECTS ? JSON.parse(process.env.CALLBACK_OBJECTS) : {};

const isCallbackSet = !!CALLBACK_URL;

/**
 * @param {import('./utils.js').WSSharedDoc} doc
 */
const callbackHandler = (doc) => {
  const room = doc.name;
  const dataToSend = {
    room,
    data: {}
  };
  const sharedObjectList = Object.keys(CALLBACK_OBJECTS);
  sharedObjectList.forEach(sharedObjectName => {
    const sharedObjectType = CALLBACK_OBJECTS[sharedObjectName];
    dataToSend.data[sharedObjectName] = {
      type: sharedObjectType,
      content: getContent(sharedObjectName, sharedObjectType, doc).toJSON()
    };
  });
  CALLBACK_URL && callbackRequest(CALLBACK_URL, CALLBACK_TIMEOUT, dataToSend);
};

/**
 * @param {URL} url
 * @param {number} timeout
 * @param {Object} data
 */
const callbackRequest = (url, timeout, data) => {
  data = JSON.stringify(data);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    timeout,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  const req = http.request(options);
  req.on('timeout', () => {
    console.warn('Callback request timed out.');
    req.abort();
  });
  req.on('error', (e) => {
    console.error('Callback request error.', e);
    req.abort();
  });
  req.write(data);
  req.end();
};

/**
 * @param {string} objName
 * @param {string} objType
 * @param {import('./utils.js').WSSharedDoc} doc
 */
const getContent = (objName, objType, doc) => {
  switch (objType) {
    case 'Array': return doc.getArray(objName)
    case 'Map': return doc.getMap(objName)
    case 'Text': return doc.getText(objName)
    case 'XmlFragment': return doc.getXmlFragment(objName)
    case 'XmlElement': return doc.getXmlElement(objName)
    default : return {}
  }
};

exports.callbackHandler = callbackHandler;
exports.isCallbackSet = isCallbackSet;
//# sourceMappingURL=callback.cjs.map
