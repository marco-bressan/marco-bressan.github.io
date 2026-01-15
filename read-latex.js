async function parseLatexCVCommands() {
    const commandRegexp = /\\newcommand\{\\([a-z]+)(IT|EN)\}\{% ([a-zA-Z ]+)$/;

    try {
	const response = await fetch('defines.tex');
	const content = await response.text();
	const lines = content.split('\n');

	const result = {};
	let i = 0;

	while (i < lines.length) {
	    const match = lines[i].match(commandRegexp);

	    if (match) {
		const commandName = match[1] + match[2];
		const contentLines = [];
		i++;

		while (i < lines.length) {
		    contentLines.push(lines[i]);
		    if (lines[i].includes('%END')) {
			result[commandName] = {
			    "content": contentLines.join('\n'),
			    "lang": match[2],
			    "title": match[3]
			};
			break;
		    }
		    i++;
		}
	    }
	    i++;
	}

	return result;
    } catch (error) {
	console.error('Error parsing LaTeX file:', error);
	return null;
    }
}

parseLatexCVCommands().then(commands => {
    console.log(commands);
});
