function newMenuEntry(command, title, lang) {
    return `<li><a href="#${command}">${title}</a></li>`
}

function buildMenu(newele) {
    let preserveList = document.querySelectorAll("#navMenu > ul > li.menu-preserve");
    let menuElement = document.querySelector("#navMenu > ul");
    menuElement.innerHTML = newele.join("\n");
    preserveList.forEach(node => menuElement.appendChild(node));
    loadMenu()
}

function loadMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = navMenu.querySelectorAll('#navMenu > ul > li > a');

    // Toggle menu
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        navMenu.classList.add('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && e.target !== menuToggle) {
            navMenu.classList.remove('active');
        }
    });

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });

    // Smooth scroll to sections
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
		const headerHeight = document.querySelector('.cv-header').offsetHeight;
		const targetPosition = targetElement.offsetTop - headerHeight - 20;

		window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
		});
            }
        });
    });
}

/**
 * Renders the parsed LaTeX commands into the CV DOM element
 */
async function renderCV(lang = "IT") {
    try {
        const commands = await parseLatexCVCommands();
        if (!commands) {
            console.error('Failed to parse LaTeX commands');
            return;
        }

        const cvMainCol = document.getElementById('cv-main-col');
	const cvSideCol = document.getElementById('cv-side-col');

        let cvMainColHTML = ''; // Clear existing content
	let cvSideColHTML = '';
	let newmenu = [];
        for (const [commandName, latexContent] of Object.entries(commands)) {
	    if (latexContent.lang !== lang) continue;
            const tokens = tokenizeLatex(latexContent.content);
            const html = `<section lang="${latexContent.lang}">
<h2 id=${commandName}>${latexContent.title}</h2>${evalPieces(tokens)}
</section>`;
	    if (/skill|education|event/.test(commandName))
		cvSideColHTML += html;
            else
		cvMainColHTML += html;
	    newmenu.push(newMenuEntry(commandName, latexContent.title, latexContent.lang));
        }
	console.log(newmenu);
	cvMainCol.innerHTML = cvMainColHTML;
	cvSideCol.innerHTML = cvSideColHTML;
	buildMenu(newmenu);

	document.querySelectorAll("*[lang]:not(html)").forEach(ele => {
	    let invert = ele.lang.startsWith("!");
	    let show = ele.lang.includes(lang);
	    if (show && !invert || !show && invert)
		ele.classList.remove("hidden");
	    else if  (!show && !invert || show && invert) {
		ele.classList.add("hidden");
	    }
	});

    } catch (error) {
        console.error('Error rendering CV:', error);
    }
}

// Auto-render CV when the page loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', e => renderCV());
}
