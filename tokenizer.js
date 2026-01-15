/**
 * Tokenizes LaTeX string into array of tokens for parsing
 * @param {string} latexString - The LaTeX string to tokenize
 * @returns {Array} Array of tokens (strings, numbers for depth markers)
 */
function tokenizeLatex(latexString) {
    let tokens = [];
    let lastPieceStart = 0;
    let lastPieceLen = 0;
    let inCommand = false;
    let inComment = false;
    let depth = 0;
    let braceDepth = 0; // Track actual brace nesting for debugging

    for (let i = 0; i <= latexString.length; i++) {
	if (i >= latexString.length) {
	    // Push final piece of text if there's any remaining
	    if (lastPieceLen > 0)
		tokens.push(latexString.substr(lastPieceStart, lastPieceLen));
	    break;
	}
	let cc = latexString[i];
	let ccat = parseCatChr(cc);

	// Handle comment
	if (inComment) {
	    if (ccat === 5) { // End comment at newline
		inComment = false;
		lastPieceStart = i + 1;
		lastPieceLen = 0;
	    }
	    continue;
	}
	// Handle regular text characters, numbers, letters, and whitespace
	if (ccat <= 0 || ccat >= 4) {
	    if (ccat === 6) inComment = true;
	    if (inComment || ccat != 0 && inCommand) {
		// Start of comment or command name end - release token and reset tracking
		inCommand = false;
		if (lastPieceLen > 0)
		    tokens.push(latexString.substr(lastPieceStart, lastPieceLen));
		if (ccat < 0) tokens.push(cc); // Add special characters directly
		lastPieceStart = i + 1;
		lastPieceLen = 0;
	    } else {
		// Continue building current text piece
		lastPieceLen++
	    }
	    continue;
	}

	// Handle braces { } - these are critical for argument parsing
	if (ccat == 2 || ccat == 3) { // ccat == 2 = '{', ccat == 3 = '}'
	    inCommand = false; // Commands cannot span across braces
	    if (lastPieceLen > 0)
		tokens.push(latexString.substr(lastPieceStart, lastPieceLen)); // Push accumulated text
	    lastPieceStart = i + 1;
	    lastPieceLen = 0;

	    if (ccat == 2) { // Opening brace
		braceDepth++;
		depth++;
		tokens.push(depth); // Push current depth as a marker
	    } else { // Closing brace
		if (depth <= 0) {
		    console.warn(`Unbalanced closing brace at position ${i}, depth ${depth}`);
		}
		tokens.push(depth); // Push current depth as matching marker
		depth--;
		braceDepth--;
	    }
	    continue;
	}

	// Handle backslash - start of LaTeX command
	if (ccat == 1) {
	    if (inCommand) {
		// Double backslash - treat as line break command
		tokens.push("\\\\");
		lastPieceStart = i + 1;
		lastPieceLen = 0;
		inCommand = false;
	    } else {
		inCommand = true; // Start new command
		if (lastPieceLen > 0)
		    tokens.push(latexString.substr(lastPieceStart, lastPieceLen));
		lastPieceStart = i;
		lastPieceLen = 1; // Include the backslash
	    }
	    continue;
	}
    }

    return tokens;
}

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
    case '%': return 6;     // comment
    default: return -2;    //special char
    }
}