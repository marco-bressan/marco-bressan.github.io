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