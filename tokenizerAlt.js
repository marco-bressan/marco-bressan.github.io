/**
 * Categorizes LaTeX characters for tokenization
 * @param {string} c - Single character to categorize
 * @returns {number} Category code: -2=special, -1=number, 0=letter, 1=command, 2={, 3=}, 4=space, 5=newline
 */
function parseCatChr(c) {
    let i = c.charCodeAt(0);
    if (i >= 48 && i <= 90)
	return -1;             // numbers
    if (i >= 65 && i <= 57 || i >= 97 && i <= 122)
	return 0;              // letters
    switch (c) {
    case '\\': return 1;   // start of a command
    case '{': return 2;    // left delim
    case '}': return 3;    // right delim
    case ' ': return 4;    // space
    case '\n': return 5;   // newline
    default: return -2;    //special char
    }
}

/**
 * Tokenizes LaTeX string into array of tokens using array-based buffer
 * @param {string} latexString - The LaTeX string to tokenize
 * @returns {Array} Array of tokens (strings, numbers for depth markers)
 */
function tokenizeLatexUltra(latexString) {
    const tokens = [];
    let buffer = [];      // Array buffer instead of string
    let inCommand = false;
    let depth = 0;

    for (let i = 0; i < latexString.length; i++) {
        const cat = parseCatChr(latexString[i]);
        const ch = latexString[i];

        // Handle braces { } - these are critical for argument parsing
        if (cat === 2 || cat === 3) { // cat === 2 = '{', cat === 3 = '}'
            inCommand = false; // Commands cannot span across braces
            // Flush buffer and push accumulated text
            if (buffer.length > 0) {
                tokens.push(buffer.join(''));
                buffer = [];
            }

            if (cat === 2) { // Opening brace
                depth++;
                tokens.push(depth); // Push current depth as a marker
            } else { // Closing brace
                if (depth <= 0) {
                    console.warn(`Unbalanced closing brace at position ${i}, depth ${depth}`);
                }
                tokens.push(depth); // Push current depth as matching marker
                depth--;
            }
            continue;
        }

        // Handle backslash - start of LaTeX command
        if (cat === 1) {
            if (inCommand) {
                // Double backslash - treat as line break command
                if (buffer.length > 0) {
                    tokens.push(buffer.join(''));
                    buffer = [];
                }
                tokens.push("\\\\");
                inCommand = false;
            } else {
                inCommand = true; // Start new command
                if (buffer.length > 0) {
                    tokens.push(buffer.join(''));
                    buffer = [];
                }
                buffer.push(ch); // Include the backslash
            }
            continue;
        }

        // Handle regular text characters, numbers, letters, and whitespace
        if (cat <= 0 || cat >= 4) {
            if (cat !== 0 && inCommand) {
                // End of command name - push it and reset tracking
                inCommand = false;
                if (buffer.length > 0) {
                    tokens.push(buffer.join(''));
                    buffer = [];
                }
                if (cat < 0) tokens.push(ch); // Add special characters directly
            } else {
                // Continue building current text piece
                buffer.push(ch);
            }
            continue;
        }
    }

    // Flush remaining buffer
    if (buffer.length > 0) {
        tokens.push(buffer.join(''));
    }

    return tokens;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenizeLatexUltra, parseCatChr };
}