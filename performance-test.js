#!/usr/bin/env node

const { tokenizeLatexUltra } = require('./tokenizerAlt.js');

// Import original tokenizer
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

function tokenizeLatex(latexString) {
    const tokens = [];
    let lastPieceStart = 0;
    let lastPieceLen = 0;
    let inCommand = false;
    let depth = 0;
    let braceDepth = 0;

    for (let i = 0; i <= latexString.length; i++) {
	if (i >= latexString.length) {
	    if (lastPieceLen > 0)
		tokens.push(latexString.substr(lastPieceStart, lastPieceLen));
	    break;
	}
	let cc = latexString[i];
	let ccat = parseCatChr(cc);

	if (ccat <= 0 || ccat >= 4) {
	    if (ccat != 0 && inCommand) {
		inCommand = false;
		if (lastPieceLen > 0)
		    tokens.push(latexString.substr(lastPieceStart, lastPieceLen));
		if (ccat < 0) tokens.push(cc);
		lastPieceStart = i + 1;
		lastPieceLen = 0;
	    } else {
		lastPieceLen++
	    }
	    continue;
	}

	if (ccat == 2 || ccat == 3) {
	    inCommand = false;
	    if (lastPieceLen > 0)
		tokens.push(latexString.substr(lastPieceStart, lastPieceLen));
	    lastPieceStart = i + 1;
	    lastPieceLen = 0;

	    if (ccat == 2) {
		braceDepth++;
		depth++;
		tokens.push(depth);
	    } else {
		if (depth <= 0) {
		    console.warn(`Unbalanced closing brace at position ${i}, depth ${depth}`);
		}
		tokens.push(depth);
		depth--;
		braceDepth--;
	    }
	    continue;
	}

	if (ccat == 1) {
	    if (inCommand) {
		tokens.push("\\\\");
		lastPieceStart = i + 1;
		lastPieceLen = 0;
		inCommand = false;
	    } else {
		inCommand = true;
		if (lastPieceLen > 0)
		    tokens.push(latexString.substr(lastPieceStart, lastPieceLen));
		lastPieceStart = i;
		lastPieceLen = 1;
	    }
	    continue;
	}
    }

    return tokens;
}

// Performance test - multiple document sizes
const testCases = new Map([
    ['small', `
\\cvrow{Laurea Magistrale}{Università}{\\cvdatefromto{Set. 2023}{Nov. 2025}}{}{Tesi: \\textit{Test}\\\\
Valutazione: 104/110
}`.repeat(10)],
    ['medium', `
\\cvrow{Laurea Magistrale in Scienze Statistiche}{Università degli Studi di Padova}{\\cvdatefromto{Set. 2023}{Nov. 2025}}{}{Tesi: \\textit{Network Control Risk Regression: An Integrated Approach to Network Meta-Analysis in Case-Control Studies}\\\\
Valutazione: 104/110
}

\\divider

\\cvrow{Laurea Triennale in Statistica Matematica e Trattamento Informatico dei Dati (SMID)}{Università degli Studi di Genova}{\\cvdatefromto{Set. 2018}{Set. 2022}}{}{Tesi: \\textit{Modelli demografici predittivi subregionali per la Liguria}\\\\
Valutazione: 109/110
}`.repeat(50)],
    ['large', `
\\cvrow{Laurea Magistrale in Scienze Statistiche}{Università degli Studi di Padova}{\\cvdatefromto{Set. 2023}{Nov. 2025}}{}{Tesi: \\textit{Network Control Risk Regression: An Integrated Approach to Network Meta-Analysis in Case-Control Studies}\\\\
Valutazione: 104/110
}

\\divider

\\cvrow{Laurea Triennale in Statistica Matematica e Trattamento Informatico dei Dati (SMID)}{Università degli Studi di Genova}{\\cvdatefromto{Set. 2018}{Set. 2022}}{}{Tesi: \\textit{Modelli demografici predittivi subregionali per la Liguria}\\\\
Valutazione: 109/110
}`.repeat(200)]
]);

for (const [name, testLatex] of testCases) {
    console.log(`\n=== ${name.toUpperCase()} TEST (${testLatex.length} chars) ===`);

    // Test original tokenizer
    console.time('Original tokenizer');
    const originalTokens = tokenizeLatex(testLatex);
    console.timeEnd('Original tokenizer');

    // Test ultra tokenizer
    console.time('Ultra tokenizer');
    const ultraTokens = tokenizeLatexUltra(testLatex);
    console.timeEnd('Ultra tokenizer');

    console.log(`Original tokens: ${originalTokens.length}`);
    console.log(`Ultra tokens: ${ultraTokens.length}`);
}
