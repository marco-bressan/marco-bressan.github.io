// Your LaTeX command
const latexCommand = `\\cvrow{Laurea Magistrale in Scienze Statistiche}{Università degli Studi di Padova}{\\cvdatefromto{Set. 2023}{Nov. 2025}}{}{Tesi: \\textit{Network Control Risk Regression: An Integrated Approach to Network Meta-Analysis in Case-Control Studies}\\\\
Valutazione: 104/110
}

\\divider

\\cvrow{Laurea Triennale in Statistica Matematica e Trattamento Informatico dei Dati (SMID)}{Università degli Studi di Genova}{\\cvdatefromto{Set. 2018}{Set. 2022}}{}{Tesi: \\textit{Modelli demografici predittivi subregionali per la Liguria}\\\\
Valutazione: 109/110%END
}`;

console.log(latexCommand);

//var latex1 =  "\\cvrow{Laurea Magistrale in Scienze Statistiche}{Università degli Studi di Padova}{\\cvdatefromto{Set. 2023}{Nov. 2025}}{}{Tesi: \\textit{Network Control Risk Regression: An Integrated Approach to Network Meta-Analysis in Case-Control Studies}\\\\\nValutazione: 104/110%END\n}\n\n"

var latex1 = "Ehi, \\cvdatefromto[ciao]{Set. 2018}{Set. 2022}! \\small{Ciao, \\textit {come va} la vita?}\\\\A me tutto \\divider bene grazie {}! {Ancora \\itshape? più difficile!}"
console.log(latex1);

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

// Tokenize the test LaTeX string using both tokenizers for comparison
var tokens = tokenizeLatex(latex1);
var ultraTokens = tokenizeLatexUltra(latex1);

console.log("Original tokenizer:", tokens);
console.log("Ultra tokenizer:", ultraTokens);
console.log("Tokenizers match:", JSON.stringify(tokens) === JSON.stringify(ultraTokens));
console.log("Note: Ultra tokenizer splits \\\\ into separate tokens, which is more accurate");

/**
 * LaTeX command palette defining available commands and their handlers
 * Format: commandName: [numberOfMandatoryArgs, callbackFunction]
 */
const LatexCommandPalette = {
    "\\textit": [1, (x, ...xargs) => `<em>${x}</em>`],
    "\\emph": [1, (x, ...xargs) => `<em>${x}</em>`],
    "\\cvdatefromto": [2, (x, y, ...xargs) => `${x} - ${y}${xargs.length === 0 ? "" : " " + xargs[0]}`],
    "\\divider": [0, (...xargs) => `<br/><hline/><br/>`],
    "\\relax": [0, (...xargs) => ""],
    "\\": [0, (...xargs) => ""],
    "\\\\": [0, (...xargs) => "<br/>"],
    "\\item": [undefined, (...xargs) => `<li>${xargs.join("")}</li>`], //PROVVISORIO!
    "\\cvrow": [5, (title, employer, time, place, desc, ...xargs) => `
<h3>${title}</h3>
<h4>${employer}</h4>
<p>${time}</p>
<p>${place}</p>
<p>${desc}</p>
`],
    "\\begin": [1, (env) => {
	switch (env) {
	case "itemize": return "<ul>";
	case "citemize": return "<ul>";
	case "enumerate": return "<ol>";
	}
    }],
    "\\end": [1, (env) => {
	switch (env) {
	case "itemize": return "</ul>";
	case "citemize": return "</ul>";
	case "enumerate": return "</ol>";
	}
    }],
};

function getMarkupScope(pieces, from = 0, depth = 1, endl = true) {
    for (let i = from; i < pieces.length; i++) {
	let p = pieces[i];
	if (endl && typeof p === "string" && p.includes('\n')) {
	    let chrid = p.indexOf('\n');
	    pieces.splice(i, 1, ...[p.substr(0, chrid), p.substr(chrid)]);
	    return [[from, i + 1]];
	}
	if (typeof p === "number" && p <= depth) {
	    return [[from, i]];
	}
    }
    return [[from, pieces.length]];
}

/**
 * Consumes and returns markup scope content from pieces array
 * @param {Array} pieces - Array of tokens (modified by shift())
 * @param {number} depth - Current depth for validation
 * @param {boolean} endl - Whether to stop at newline
 * @returns {Array} Array with single content array: [[tokens...]]
 */
function getMarkupScopeConsume(pieces, depth = 0, endl = true) {
    console.log(`[getMarkupScopeConsume] START: depth=${depth}, endl=${endl}`);
    console.log(`[getMarkupScopeConsume] pieces context:`, JSON.stringify(pieces.slice(0, 10)));
    
    let content = [];
    
    while (pieces.length > 0) {
	let p = pieces[0];
	
	if (endl && typeof p === "string" && p.includes('\n')) {
	    // Split at newline and consume first part
	    let chrid = p.indexOf('\n');
	    let before = p.substr(0, chrid);
	    let after = p.substr(chrid);
	    pieces.shift();
	    if (before) content.push(before);
	    if (after) pieces.unshift(after); // Put remainder back
	    break;
	}
	
	if (typeof p === "number" && p <= depth) {
	    // Found end marker, stop here
	    break;
	}
	
	// Consume token and add to content
	content.push(pieces.shift());
    }
    
    console.log(`[getMarkupScopeConsume] END: returning`, [content]);
    return [content];
}

function getNextArgs(pieces, nargs = 1, from = 0, depth = 0) {
    // Get indices for the next 'nargs' arguments at the specified depth
    // Returns array of [startIdx, endIdx] pairs for each argument
    console.log(`[getNextArgs] START: nargs=${nargs}, from=${from}, depth=${depth}`);
    console.log(`[getNextArgs] pieces context:`, JSON.stringify(pieces.slice(from, from + 10)));

    if (nargs == 0) return [];
    let delimIdx = [];
    let firstIdx = -1;
    let open = false;
    let optavail = true;
    let optreg = /\][ \n\t]*$/;
    let optreg2 = /^\[[\w\W]+\][ \n\t]*$/;
    let i = from;

    while (nargs > 0 && i < pieces.length) {
	let p = pieces[i];
	console.log(`[getNextArgs] Loop: i=${i}, p=${JSON.stringify(p)}, type=${typeof p}, nargs=${nargs}, open=${open}`);
	if (optavail && delimIdx.length > 0) optavail = false; // opt param allowed only at first arg
	if (typeof p == "number" && p === depth + 1) {
	    let end = pieces.indexOf(depth + 1, i + 1)
	    if (end < 0) throw "no matching closing brace of depth ${p} in [${pieces}]"
	    delimIdx.push([i + 1, end]);
	    i = end + 1;
	    nargs--;
	    continue;
	}
	if (typeof p == "string" && optavail) {
	    if (p === "[") {
		open = true;
		firstIdx = i + 1;
		i++;
		continue;
	    }
	    if (optreg2.test(p)) {
		delimIdx.push([i, i + 1]);
		i++;
		continue;
	    }
	    if (open && optreg.test(p)) {
		// Found end of optional parameter (string ending with ']')
		console.log(`[getNextArgs] Found optional param end, adding [${firstIdx}, ${i + 1}]`);
		open = false;
		delimIdx.push([firstIdx, i + 1]);
		i++;
		continue;
	    }
	    i++;
	} else {
	    throw `Invalid element at index ${i}: ${JSON.stringify(p)}`;
	}
    }

    // Handle case where we reach end of pieces array
    if (open && i >= pieces.length) {
	console.log(`[getNextArgs] Reached end of array with open=${open}`);
	delimIdx.push([firstIdx, pieces.length]);
    }

    console.log(`[getNextArgs] END: returning`, delimIdx);
    return delimIdx;
}

/**
 * Consumes and returns the next 'nargs' arguments from pieces array
 * @param {Array} pieces - Array of tokens (modified by shift())
 * @param {number} nargs - Number of arguments to consume
 * @param {number} depth - Current depth for validation
 * @returns {Array} Array of argument arrays: [[tokens...], [tokens...], ...]
 * @throws {Error} If optional argument not at start or unbalanced braces
 */
function getNextArgsConsume(pieces, nargs = 1, depth = 0) {
    console.log(`[getNextArgsConsume] START: nargs=${nargs}, depth=${depth}`);
    console.log(`[getNextArgsConsume] pieces context:`, JSON.stringify(pieces.slice(0, 10)));

    if (nargs == 0) return [];
    let args = [];
    let optavail = true;
    let optreg = /\][ \n\t]*$/;
    let optreg2 = /^\[[\w\W]+\][ \n\t]*$/;

    while (nargs > 0 && pieces.length > 0) {
	let p = pieces[0];
	console.log(`[getNextArgsConsume] Loop: p=${JSON.stringify(p)}, type=${typeof p}, nargs=${nargs}`);
	
	if (optavail && args.length > 0) optavail = false; // opt param allowed only at first arg
	
	if (typeof p == "number" && p === depth + 1) {
	    // Found opening brace marker, consume it and collect until matching closing
	    pieces.shift(); // Remove opening depth marker
	    let argContent = [];
	    let braceCount = 1;
	    
	    while (pieces.length > 0 && braceCount > 0) {
		let token = pieces.shift();
		if (typeof token === "number" && token === depth + 1) {
		    braceCount--;
		} else if (typeof token === "number" && token === depth + 2) {
		    braceCount++;
		}
		if (braceCount > 0) {
		    argContent.push(token);
		}
	    }
	    args.push(argContent);
	    nargs--;
	} else if (typeof p == "string" && optavail) {
	    if (p === "[") {
		// Optional argument start - collect until closing ]
		pieces.shift(); // Remove opening bracket
		let optContent = [];
		let optregEnd = /\][ \n\t]*$/;
		
		while (pieces.length > 0) {
		    let token = pieces[0];
		    if (typeof token === "string" && optregEnd.test(token)) {
			// Found closing bracket, remove trailing ] and add content
			let cleanToken = token.replace(/\][ \n\t]*$/, '');
			pieces.shift();
			if (cleanToken) optContent.push(cleanToken);
			args.push(optContent);
			break;
		    } else {
			optContent.push(pieces.shift());
		    }
		}
	    } else if (optreg2.test(p)) {
		// Complete optional argument in one token
		let cleanToken = p.replace(/\[[ \n\t]*|[ \n\t]*\]$/g, '');
		pieces.shift();
		args.push([cleanToken]);
	    } else {
		throw `Optional argument must be at start: found "${p}" after ${args.length} arguments`;
	    }
	} else {
	    throw `Invalid element for argument parsing: ${JSON.stringify(p)}`;
	}
    }

    console.log(`[getNextArgsConsume] END: returning`, args);
    return args;
}

function evalPieces(pieces, depth = 0) {
    // Recursively evaluate parsed LaTeX pieces into HTML
    // Added depth parameter to prevent infinite recursion and track nesting level
    console.log(`[evalPieces] START: depth=${depth}, pieces=${JSON.stringify(pieces.slice(0, 5))}...`);

    let len = pieces.length;
    if (len == 0) {
        console.log(`[evalPieces] Empty pieces array, returning ""`);
        return "";
    }
    let car = pieces[0];
    if (car === undefined) {
        console.log(`[evalPieces] Undefined car, returning "<undefined!>"`);
        return "<undefined!>";
    }

    // Prevent infinite recursion by limiting depth
    if (depth > 50) {
        console.warn(`Maximum recursion depth (50) exceeded at: ${(car)}`);
        return `<recursion-error>`;
    }

    // Handle nested arrays (shouldn't occur in normal tokenization)
    if (Array.isArray(car)) {
        console.log(`[evalPieces] Found array, recursing...`);
        return evalPieces(car, depth + 1) + evalPieces(pieces.slice(1), depth);
    }

    // Handle depth markers (numbers represent brace depth)
    if (typeof car == "number") {
        console.log(`[evalPieces] Found depth marker ${car}`);
	// Find matching closing brace with same depth value
	let end = pieces.indexOf(car, 1);
	if (end < 0) {
            console.log(`[evalPieces] ERROR: Unbalanced bracket of depth ${car}`);
            console.warn (`Unbalanced bracket of depth ${car} in [${pieces}]`);
	    return '';
        }
        console.log(`[evalPieces] Found matching bracket at index ${end}, recursing into content...`);
	// Recursively evaluate content between braces, then continue with rest
	let contentResult = evalPieces(pieces.slice(1, end), depth + 1);
	let restResult = evalPieces(pieces.slice(end + 1), depth);
        console.log(`[evalPieces] Content result: "${contentResult}", rest result starts...`);
	return contentResult + restResult;
    }

    if (typeof car != "string") {
        console.log(`[evalPieces] ERROR: Unexpected input type: ${typeof car}, value: ${(car)}`);
	throw `Unexpected input of piece: ${(car)}`;
    }

    // Handle optional arguments in square brackets
    if (car === "[") {
        console.log(`[evalPieces] Found optional argument start`);
	// NOTE: limited support for literal [...]
	let end = pieces.findLastIndex(x => typeof x === "string" && x.substr(-1, 1) === "]");
	if (end < 0) {
            console.log(`[evalPieces] ERROR: Unbalanced square brackets`);
            throw `Unbalanced square brackets in [${pieces}]`;
        }
	// Remove the trailing ']' from the closing string
	pieces[end] = pieces[end].substr(0,  pieces[end].length - 1);
	// Evaluate content inside brackets, then continue with rest
        console.log(`[evalPieces] Processing optional content to index ${end}`);
	return evalPieces(pieces.slice(1, end + 1), depth) + // do not increment depth for [...]
	    evalPieces(pieces.slice(end + 1), depth);
    }

    // Handle plain text (not a LaTeX command)
    if (car.substr(0, 1) != "\\") {
        console.log(`[evalPieces] Plain text: "${car}"`);
	return car + evalPieces(pieces.slice(1), depth);
    }

    // Parse LaTeX command
    console.log(`[evalPieces] Found LaTeX command: "${car}"`);
    let commandInfo = LatexCommandPalette[car];
    let result = "";
    let end = 0;

    if (commandInfo === undefined) {
        console.log(`[evalPieces] Unknown command "${car}"`);
	result = `<Unknown command '${car}'>`;
	end = 0; // No arguments consumed for unknown commands
    } else {
        console.log(`[evalPieces] Known command "${car}" with ${commandInfo[0]} args`);
	// Handle the case of markup argument like {... \small ...} or \item .... \n
	let markup = commandInfo[0] === undefined;
	// Get argument indices for this command, starting from position 1 (after command)
	// Pass current depth to properly handle nested braces
	let argidx = markup ? getMarkupScope(pieces, 1, depth)
	    : getNextArgs(pieces, commandInfo[0], 1, depth);
        console.log(`[evalPieces] Got argidx: ${JSON.stringify(argidx)}`);

	// Find the end index of the last consumed argument
	if (argidx.length > 0) {
	    end = argidx[argidx.length - 1][1];
	} else {
	    end = 0; // No arguments found
	}

	// Evaluate each argument recursively, passing increased depth
        console.log(`[evalPieces] Evaluating ${argidx.length} arguments...`);
	let args = argidx.map(i => {
            let argContent = pieces.slice(...i);
            console.log(`[evalPieces] Evaluating argument: ${JSON.stringify(argContent)}`);
	    // [Workaround] Do not increase depth counter in markup mode!
            return evalPieces(argContent, depth + !markup);
        });
        console.log(`[evalPieces] Evaluated args: ${JSON.stringify(args)}`);

	// Handle case where we got more arguments than expected (optional params)
	if (argidx.length > commandInfo[0]) args.push(args.shift());

	// Execute the command callback with evaluated arguments
	result = commandInfo[1](...args);
        console.log(`[evalPieces] Command result: "${result}"`);
    }

    // Continue evaluating the rest of the pieces after this command
    console.log(`[evalPieces] Continuing with rest from index ${end + 1}`);
    let restResult = evalPieces(pieces.slice(end + 1), depth);
    result += restResult;
    console.log(`[evalPieces] FINAL result: "${result}"`);
    return result;
}

/**
 * Recursively evaluates parsed LaTeX pieces into HTML using token consumption
 * @param {Array} pieces - Array of tokens (modified by shift())
 * @param {number} depth - Current depth for validation and recursion tracking
 * @returns {string} HTML representation of the parsed LaTeX
 * @throws {Error} If maximum recursion depth exceeded or invalid tokens encountered
 */
function evalPiecesConsume(pieces, depth = 0) {
    console.log(`[evalPiecesConsume] START: depth=${depth}, pieces=${JSON.stringify(pieces.slice(0, 5))}...`);

    if (pieces.length == 0) {
        console.log(`[evalPiecesConsume] Empty pieces array, returning ""`);
        return "";
    }
    
    let car = pieces.shift(); // Consume first token
    if (car === undefined) {
        console.log(`[evalPiecesConsume] Undefined car, returning "<undefined!>"`);
        return "<undefined!>";
    }

    // Prevent infinite recursion by limiting depth
    if (depth > 50) {
        console.warn(`Maximum recursion depth (50) exceeded at: ${(car)}`);
        return `<recursion-error>`;
    }

    // Handle nested arrays (shouldn't occur in normal tokenization)
    if (Array.isArray(car)) {
        console.log(`[evalPiecesConsume] Found array, recursing...`);
        return evalPiecesConsume(car, depth + 1) + evalPiecesConsume(pieces, depth);
    }

    // Handle depth markers (numbers represent brace depth)
    if (typeof car == "number") {
        console.log(`[evalPiecesConsume] Found depth marker ${car}`);
	// Collect content until matching closing brace marker
	let content = [];
	let braceCount = 1;
	
	while (pieces.length > 0 && braceCount > 0) {
	    let token = pieces[0];
	    if (typeof token === "number" && token === car) {
		braceCount--;
		if (braceCount > 0) {
		    content.push(pieces.shift());
		} else {
		    pieces.shift(); // Remove matching closing marker
		}
	    } else if (typeof token === "number" && token === car + 1) {
		braceCount++;
		content.push(pieces.shift());
	    } else {
		content.push(pieces.shift());
	    }
	}
	
        console.log(`[evalPiecesConsume] Found matching bracket, recursing into content...`);
	let contentResult = evalPiecesConsume(content, depth + 1);
	let restResult = evalPiecesConsume(pieces, depth);
        console.log(`[evalPiecesConsume] Content result: "${contentResult}", rest result starts...`);
	return contentResult + restResult;
    }

    if (typeof car != "string") {
        console.log(`[evalPiecesConsume] ERROR: Unexpected input type: ${typeof car}, value: ${(car)}`);
	throw `Unexpected input of piece: ${(car)}`;
    }

    // Handle optional arguments in square brackets
    if (car === "[") {
        console.log(`[evalPiecesConsume] Found optional argument start`);
	// Collect content until closing ]
	let optContent = [];
	let optregEnd = /\][ \n\t]*$/;
	
	while (pieces.length > 0) {
	    let token = pieces[0];
	    if (typeof token === "string" && optregEnd.test(token)) {
		// Found closing bracket, remove trailing ] and add content
		let cleanToken = token.replace(/\][ \n\t]*$/, '');
		pieces.shift();
		if (cleanToken) optContent.push(cleanToken);
		break;
	    } else {
		optContent.push(pieces.shift());
	    }
	}
	
        console.log(`[evalPiecesConsume] Processing optional content`);
	return evalPiecesConsume(optContent, depth) + // do not increment depth for [...]
	    evalPiecesConsume(pieces, depth);
    }

    // Handle plain text (not a LaTeX command)
    if (car.substr(0, 1) != "\\") {
        console.log(`[evalPiecesConsume] Plain text: "${car}"`);
	return car + evalPiecesConsume(pieces, depth);
    }

    // Parse LaTeX command
    console.log(`[evalPiecesConsume] Found LaTeX command: "${car}"`);
    let commandInfo = LatexCommandPalette[car];
    let result = "";

    if (commandInfo === undefined) {
        console.log(`[evalPiecesConsume] Unknown command "${car}"`);
	result = `<Unknown command '${car}'>`;
    } else {
        console.log(`[evalPiecesConsume] Known command "${car}" with ${commandInfo[0]} args`);
	// Handle the case of markup argument like {... \small ...} or \item .... \n
	let markup = commandInfo[0] === undefined;
	// Get arguments using consume-based functions
	let args = markup ? getMarkupScopeConsume(pieces, depth)
	    : getNextArgsConsume(pieces, commandInfo[0], depth);
        console.log(`[evalPiecesConsume] Got args: ${JSON.stringify(args)}`);

	// Evaluate each argument recursively, passing increased depth
        console.log(`[evalPiecesConsume] Evaluating ${args.length} arguments...`);
	let evaluatedArgs = args.map(arg => {
            console.log(`[evalPiecesConsume] Evaluating argument: ${JSON.stringify(arg)}`);
	    // [Workaround] Do not increase depth counter in markup mode!
            return evalPiecesConsume(arg, depth + !markup);
        });
        console.log(`[evalPiecesConsume] Evaluated args: ${JSON.stringify(evaluatedArgs)}`);

	// Handle case where we got more arguments than expected (optional params)
	if (evaluatedArgs.length > commandInfo[0] && commandInfo[0] !== undefined) {
	    evaluatedArgs.push(evaluatedArgs.shift());
	}

	// Execute the command callback with evaluated arguments
	result = commandInfo[1](...evaluatedArgs);
        console.log(`[evalPiecesConsume] Command result: "${result}"`);
    }

    // Continue evaluating the rest of the pieces
    let restResult = evalPiecesConsume(pieces, depth);
    result += restResult;
    console.log(`[evalPiecesConsume] FINAL result: "${result}"`);
    return result;
}

/**
 * Main function to demonstrate LaTeX parsing
 */
function main() {
    console.log("=== LaTeX Parser Demo ===");
    console.log("Input LaTeX:", latex1);
    console.log("Tokens:", tokens);

    // Test cases for evaluation
    var test0 = [
        ["Prova di un", " semplice array!", 1, 2, " (con un twist", 2, 1, ")"],
        ["Un piccolo ", "\\textit", 1, "argomento", 1, " per noi..."],
        ["\\comando", "[", "un ", "\\textit", 1, "argomento", 1, " opzionale]"]
    ];
    var test1 = tokens.slice(1, 11);
    var test2 = tokens.slice(11, 20);
    var test3 = tokens.slice(27, 34);
    var test4 = tokens.slice(20, 27);

    console.log("=== Test Cases ===");
    console.log(test0);
    console.log("=== Evaluation Results ===");
    console.log(test0.map(evalPieces));
}

// Run the main function if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    main();
}

/**
 * Renders the parsed LaTeX commands into the CV DOM element
 */
async function renderCV() {
    try {
        const commands = await parseLatexCVCommands();
        if (!commands) {
            console.error('Failed to parse LaTeX commands');
            return;
        }

        const cvElement = document.getElementById('cv');
        if (!cvElement) {
            console.error('CV element not found');
            return;
        }

        cvElement.innerHTML = ''; // Clear existing content

        for (const [commandName, latexContent] of Object.entries(commands)) {
            const tokens = tokenizeLatex(latexContent);
            const html = evalPieces(tokens);
            cvElement.innerHTML += `<section><h2>${commandName}</h2>${html}</section>`;
        }
    } catch (error) {
        console.error('Error rendering CV:', error);
    }
}

// Auto-render CV when the page loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', renderCV);
}
