\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{acadCV}[2025/12/30 Marco Bressan CV Class]

\LoadClass[11pt]{article}

% Geometry and core packages
\usepackage[margin=1in]{geometry}
\usepackage{multirow}
\usepackage{tikz}
\usepackage[italian]{babel}  % Assuming Italian; change if needed
\usepackage{hyperref}
\usepackage{fontawesome5}

% Custom section formatting
\makeatletter
\renewcommand\section{%
  \@startsection{section}{1}{0pt}%
  {-3.5ex plus -1ex minus -.2ex}%
  {2.3ex plus .2ex}%
  {\sffamily\Large\bfseries}%
}

% Enhanced \maketitle for CV header
\renewcommand{\maketitle}{%
	\begin{tabular}{p{.525\textwidth}r}
		\LARGE\sffamily\bfseries \@title & \\
		\Large\sffamily\itshape \@tagline & \faIcon{phone} \@phone \\
		 & \faIcon{envelope} \href{mailto:\@email}{\texttt{\@email}} \\
		\large \@subtitle & \faIcon{linkedin} \href{\@linkedin}{\@linkedinname} \hspace{.5cm} \faIcon{github} \href{\@github}{\@githubname} \\
		\large \@affiliation & \faIcon{orcid} \href{\@orcid}{\@orcid} \\
	\end{tabular}\\[.5cm]
	\noindent
	\begin{tabular}{p{1\textwidth}}
		\hline\\
	\end{tabular}
}

% User-defined fields for personal info
\def\@tagline{}
\newcommand{\tagline}[1]{\gdef\@tagline{#1}}

\def\@phone{}
\newcommand{\phone}[1]{\gdef\@phone{(#1)}}

\def\@email{}
\newcommand{\email}[1]{\gdef\@email{#1}}

\def\@subtitle{}
\newcommand{\subtitle}[1]{\gdef\@subtitle{#1}}

\def\@affiliation{}
\newcommand{\affiliation}[1]{\gdef\@affiliation{#1}}

\def\@linkedin{}
\newcommand{\linkedin}[1]{\gdef\@linkedin{#1}}

\def\@linkedinname{}
\newcommand{\linkedinname}[1]{\gdef\@linkedinname{#1}}

\def\@github{}
\newcommand{\github}[1]{\gdef\@github{#1}}

\def\@githubname{}
\newcommand{\githubname}[1]{\gdef\@githubname{#1}}

\def\@orcid{}
\newcommand{\orcid}[1]{\gdef\@orcid{#1}}

\makeatother


% CV-specific commands (unchanged)
\newcommand{\cvskip}{\\[.35cm]}
\newcommand{\cvrow}[5]{%
  \noindent%
  \begin{minipage}[t]{0.175\linewidth}%
    \raggedleft
    \sffamily #3%
  \end{minipage}%
  \hfill%
  \vline%
  \hfill%
  \begin{minipage}[t]{0.75\linewidth}%
    {\sffamily\bfseries #1}\par
    {\sffamily\itshape #2%
    \ifx\relax#4\relax\else{, #4}\par\fi}
    #5
  \end{minipage}\cvskip%
}
\newcommand{\cvtag}[1]{%
  \tikz[baseline]\node[anchor=base,draw=gray!30,rounded corners,inner xsep=1ex,inner ysep=0.75ex,text height=1.5ex,text depth=.25ex]{\sffamily #1};%
}


% Bibliography setup (unchanged)
\usepackage[backend=biber,style=apa6,sorting=ydnt]{biblatex}
\renewcommand{\bibfont}{\normalsize}
