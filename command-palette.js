// Standalone command functions

function textitCommand(x, ...xargs) {
    return `<em>${x}</em>`;
}

function emphCommand(x, ...xargs) {
    return `<em>${x}</em>`;
}

function cvdatefromtoCommand(x, y, ...xargs) {
    return `${x} - ${y}${xargs.length === 0 ? "" : " " + xargs[0]}`;
}

function dividerCommand(...xargs) {
    return `<hr>`;
}

function relaxCommand(...xargs) {
    return "";
}

function backslashCommand(...xargs) {
    return "";
}

function doubleBackslashCommand(...xargs) {
    return "<br>";
}

function itemCommand(...xargs) {
    return `<li>${xargs.join("")}</li>`;
}

function cvrowCommand(title, employer, time, place, desc, ...xargs) {
    return `
<h3>${title}</h3>
<h4>${employer}</h4>
<p>${time}</p>
<p>${place}</p>
<p>${desc}</p>
`;
}

function beginCommand(env) {
    switch (env) {
    case "itemize": return "<ul>";
    case "citemize": return "<ul>";
    case "enumerate": return "<ol>";
    default: return "";
    }
}

function endCommand(env) {
    switch (env) {
    case "itemize": return "</ul>";
    case "citemize": return "</ul>";
    case "enumerate": return "</ol>";
    default: return "";
    }
}

function cvskillsCommand(title, ...args) {
    return `<h3>${title}</h3>\n` + args
	.flatMap(x => x.split(';;'))
	.map(x => `<span class="cvskill">${x}</span>`)
	.join("\n");
}

function skillgradeCommand(x, ...args) {
    val = Number(x);
    if (val < 0 || val > 3) return `!cvgrade{${x}}`;
    return "<span>" + "🔴".repeat(val) + "⭕".repeat(3 - val) + "</span>";
}

function virgCommand(x, ...args) {
    return `“${x}”`;
}

function textbfCommand(x, ...args) {
    return `<b>${x}</b>`
}

// LaTeX command palette defining available commands and their handlers
// Format: commandName: [numberOfMandatoryArgs, callbackFunction]
const LatexCommandPalette = {
    "\\textit": [1, textitCommand],
    "\\emph": [1, emphCommand],
    "\\textbf": [1, textbfCommand],
    "\\cvdatefromto": [2, cvdatefromtoCommand],
    "\\divider": [0, dividerCommand],
    "\\relax": [0, relaxCommand],
    "\\": [0, backslashCommand],
    "\\\\": [0, doubleBackslashCommand],
    "\\item": [undefined, itemCommand],
    "\\cvrow": [5, cvrowCommand],
    "\\begin": [1, beginCommand],
    "\\end": [1, endCommand],
    "\\skillgrade": [1, skillgradeCommand],
    "\\cvskills": [2, cvskillsCommand],
    "\\virg": [1, virgCommand]
};
