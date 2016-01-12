webcrypto
=========

> WebCryptoAPI polyfil to work in Node.js in the Browser (so that you don't have to be concerned about moving crypto code between a browser and server side app) 

## Roadmap

- [x] Expose the Node.js crypto module interface
- [x] Use crypto-browserify to make it work in the browser
- [ ] Replace crypto-browserify with WebCryptoAPI when browser supports it
- [ ] Consider if we should replace the functions that TweetNaCL offers for perf/or and stability improvements

## API

This module should follow at all times the Node.js Crypto API https://nodejs.org/api/crypto.html

## Tests

This module is using tests from crypto-browserify to validate that the expectations remain fulfilled
