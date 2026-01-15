function loadMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = navMenu.querySelectorAll('a');

    // Toggle menu
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        navMenu.classList.toggle('active');
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
async function renderCV() {
    try {
        const commands = await parseLatexCVCommands();
        if (!commands) {
            console.error('Failed to parse LaTeX commands');
            return;
        }

        const cvMainCol = document.getElementById('cv-main-col');
	const cvSideCol = document.getElementById('cv-side-col');

        cvMainCol.innerHTML = ''; // Clear existing content
	cvSideCol.innerHTML = '';
	console.log(commands);
        for (const [commandName, latexContent] of Object.entries(commands)) {
            const tokens = tokenizeLatex(latexContent.content);
            const html = `<section lang="${latexContent.lang}">
<h2 id=${commandName}>${latexContent.title}</h2>${evalPieces(tokens)}
</section>`;
	    if (commandName.includes("skill") || commandName.includes("education"))
		cvSideCol.innerHTML += html;
            else
		cvMainCol.innerHTML += html;
        }
    } catch (error) {
        console.error('Error rendering CV:', error);
    }
}

// Auto-render CV when the page loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', renderCV);
}

document.addEventListener('DOMContentLoaded', loadMenu);
