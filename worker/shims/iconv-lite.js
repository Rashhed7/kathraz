// Minimal iconv-lite shim for Cloudflare Workers.
// Express's body-parser -> raw-body only ever calls iconv.getDecoder(encoding)
// and uses { write(chunk), end() } to decode UTF-8 JSON bodies. The real
// iconv-lite does stream/Buffer tricks at load time that break the Workers
// runtime, so wrangler.jsonc aliases this package to this file.
'use strict';

const SUPPORTED = {
  'utf-8': 'utf-8',
  utf8: 'utf-8',
  unicode11utf8: 'utf-8',
  ascii: 'utf-8',
  'us-ascii': 'utf-8',
  latin1: 'windows-1252',
  binary: 'windows-1252',
  'iso-8859-1': 'windows-1252',
};

function unsupported(encoding) {
  // Message must start with "Encoding not recognized: " — raw-body matches on
  // it to turn the failure into a clean 415 response.
  throw new Error(`Encoding not recognized: ${encoding} (Workers shim supports UTF-8 only)`);
}

function getDecoder(encoding) {
  const key = String(encoding || 'utf-8').toLowerCase();
  const label = SUPPORTED[key];
  if (!label) unsupported(encoding);

  const decoder = new TextDecoder(label);
  return {
    write(chunk) {
      return decoder.decode(chunk, { stream: true });
    },
    end() {
      return decoder.decode();
    },
  };
}

function decode(buffer, encoding) {
  if (typeof buffer === 'string') return buffer;
  const key = String(encoding || 'utf-8').toLowerCase();
  const label = SUPPORTED[key];
  if (!label) unsupported(encoding);
  return new TextDecoder(label).decode(buffer);
}

function encode(str /* , encoding */) {
  return Buffer.from(String(str), 'utf-8');
}

module.exports = {
  decode,
  encode,
  getDecoder,
  encodingExists(enc) {
    return !!SUPPORTED[String(enc).toLowerCase()];
  },
};
