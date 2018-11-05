class ParserSymbol {
    constructor (char, position) {
        this.char = char;
        this.position = position;
    }
}

class ParserObject {
    constructor (key, value) {
        this.key = key;
        this.value = value;
    }
}

function addObject(parent, object, keyStack) {
    // Get the last key in the stack and add it to the object
    let type = parent.value.constructor.name;
    if (type == "Object") {
        let lastKey = keyStack.pop();
        parent.value[lastKey] = object;
    } else if (type == "Array") {
        parent.value.push(object);
    } else {
        throw `Unable to add to object of type ${type}.`;
    }
}

function parse(json) {
    // Syntax
    let digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], bools = ["true", "false"], quotes = ["\"", "'"];
    let final = {}, objectStack = [], symbolStack = [], keyStack = [];
    var requireColon = false, requireKey = false, requireCommaOrClose = false;
    for (var i = 0; i < json.length; i++) {
        let char = json[i];
        //console.log("Current char:", char, "at position", i);

        // Check that the current character has not been escaped
        if (i == 0 || json[i - 1] != '\\') {
            // Utility of a switch statement here is limited since we need to check other conditions
            if (char == "{") {
                if (requireColon || requireCommaOrClose || requireKey)
                    throw `Missing colon at position ${i}.`;
                
                // Push a new element to the stack
                objectStack.push(new ParserObject(keyStack.length == 0 ? null : keyStack[keyStack.length - 1], {}));
                requireKey = true;
                requireColon = false;
                requireCommaOrClose = false;
                symbolStack.push(new ParserSymbol("{", i));
            } else if (char == "}") {
                // Check if it's valid to close here, as well as nullify the flags if the current object is empty
                if ((requireColon || requireKey) && objectStack[objectStack.length - 1].value == {})
                    throw `Expected key or colon at position ${i}.`;

                let lastSymbol = symbolStack[symbolStack.length - 1];
                if (lastSymbol.char == "{") {
                    symbolStack.pop();
                    let obj = objectStack.pop();
                    if (objectStack.length == 0) {
                        final = obj.value;
                    } else {
                        addObject(objectStack[objectStack.length - 1], obj.value, keyStack);
                        requireCommaOrClose = true;
                        requireKey = false;
                        requireColon = false;
                    }
                }
            } else if (quotes.includes(char)) {
                if (requireColon || requireCommaOrClose)
                    throw `Expected colon/comma/closing tag and found a quote at position ${i}.`;

                var result = i;
                var escaping = false;
                // TODO: string escaping
                for (var j = i + 1; j < json.length; j++) {
                    result = j;
                    if (json[j] == char && json[j - 1] != "\\")
                        break;

                    //console.log("  -> Looping chars in string: ", json[j]);
                }
                let str = json.substring(i + 1, j);
                if (requireKey) {
                    keyStack.push(str);
                    requireColon = true;
                    requireCommaOrClose = false;
                    requireKey = false;
                } else {
                    // ADDING!!
                    addObject(objectStack[objectStack.length - 1], str, keyStack);
                    requireColon = false;
                    requireCommaOrClose = true;
                    requireKey = false;
                }
                i += (j - i);
                continue;
            } else if (char == ":") {
                if (!requireColon)
                    throw `Did not expect colon at position ${i}.`;
                requireColon = false;
                requireCommaOrClose = false;
                requireKey = false;
            } else if (digits.includes(char)) {
                if (requireKey) {
                    throw `Invalid key at position ${i}.`;
                }

                if (requireColon || requireCommaOrClose)
                    throw `Expected colon/comma/block close at position ${i}.`;

                // Parse number
                var result = i;
                var foundDot = false;

                for (var j = i; j < json.length; j++) {
                    result = j;
                    if (json[j] == ".") {
                        foundDot = true;
                        continue;
                    }

                    if (!digits.includes(json[j]))
                        break;

                    //console.log("  -> Looking chars for number:", json[j]);
                }
                
                let number = foundDot ? parseFloat(json.substring(i, result)) : parseInt(json.substring(i, result));
                if (isNaN(number))
                    throw `Found invalid digit character at position ${i}.`;

                addObject(objectStack[objectStack.length - 1], number, keyStack);
                i += (result - i) - 1;

                requireColon = false;
                requireCommaOrClose = true;
                requireKey = false;
            } else if (char == ",") {
                if (requireColon || requireKey || !requireCommaOrClose)
                    throw `Unexpected comma at position ${i}.`;

                requireKey = objectStack[objectStack.length - 1].value.constructor.name == "Object";
                requireCommaOrClose = false;
                requireColon = false;
            } else if (char == "[") {
                // If this is a key and not inside a quote, gg
                if (requireKey && quotes.includes(symbolStack[symbolStack.length - 1].char))
                    throw `Invalid key at position ${i}.`;

                // Create an array object
                symbolStack.push(new ParserSymbol("[", i));
                objectStack.push(new ParserObject(keyStack.length == 0 ? null : keyStack[keyStack.length - 1], []));
                requireKey = false;
                requireColon = false;
                requireCommaOrClose = false;
            } else if (char == "]") {
                if ((requireColon || requireKey) && objectStack[objectStack.length - 1].value == {})
                    throw `Expected key/colon at position ${i}.`;

                let lastSymbol = symbolStack[symbolStack.length - 1];
                if (lastSymbol.char == "[") {
                    symbolStack.pop();
                    let obj = objectStack.pop();
                    if (objectStack.length == 0) {
                        final = obj.value;
                    } else {
                        addObject(objectStack[objectStack.length - 1], obj.value, keyStack);
                        
                        requireCommaOrClose = true;
                        requireKey = false;
                        requireColon = false;
                    }
                }
            } else if (char == " " || char == "\t") {
                // OK
                continue;
            } else {
                throw `Unexpected character at position ${i}.`;
            }
        }
    }

    if (symbolStack.length > 0) {
        throw `Expected closing tag for '${symbolStack[symbolStack.length - 1].char}' at position ${json.length}.`;
    }

    if (objectStack.length > 0 || keyStack.length > 0) {
        throw `JSON terminated abruptly.`;
    }

    return final;
}

module.exports = {
    parse: parse
};