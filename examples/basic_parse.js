// Import the module
let garbajson = require("../garbajson");

// Get a valid JSON string
let json = JSON.stringify({
    testing: "hello",
    arr: [1, 3, 3, 7],
    woah: {
        nesting: {
            on: {
                a: ["this", "is", "an", "array"]
            }
        }
    }
});

// Log the parsed object
console.log(garbajson.parse(json));