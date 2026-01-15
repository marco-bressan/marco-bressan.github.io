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