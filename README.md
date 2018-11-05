# GarbaJSON
GarbaJSON is a JSON serialiser written entirely in JavaScript. It doesn't work very well.

## How to install
Did you really thing you could download this on NPM? Come on.

## Use cases
*Broke*
```javascript
JSON.parse(jsonString);
```

*Woke*
```javascript
const garbajson = require("garbajson");
garbajson.parse(jsonString);
```

## Performance
I'm proud to announce that *GarbaJSON* is **18x** slower than then native JSON parser in V8. There's literally no reason to use it whatsoever.

## Known issues
- It does not support booleans as of right now.
- It is much slower than the native implementation.
