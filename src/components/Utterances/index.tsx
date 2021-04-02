import { useEffect } from 'react';

const addUtterancesScript = (
  parentElement,
  repo,
  label,
  issueTerm,
  theme,
  isIssueNumber
): void => {
  const script = document.createElement('script');
  script.setAttribute('src', 'https://utteranc.es/client.js');
  script.setAttribute('crossorigin', 'anonymous');
  script.setAttribute('async', 'true');
  script.setAttribute('repo', repo);

  if (label !== '') {
    script.setAttribute('label', label);
  }

  if (isIssueNumber) {
    script.setAttribute('issue-number', issueTerm);
  } else {
    script.setAttribute('issue-term', issueTerm);
  }

  script.setAttribute('theme', theme);

  parentElement.appendChild(script);
};

export default function UtterancesComments(): JSX.Element {
  const repo = 'GH-Marc/ignite-utterances';
  const theme = 'github-dark';
  const issueTerm = 'pathname';
  const label = 'blog-comment';

  useEffect(() => {
    const commentsBox = document.getElementById('commentsBox');

    if (!commentsBox) {
      return;
    }

    const utterances = document.getElementsByClassName('utterances')[0];

    if (utterances) {
      utterances.remove();
    }

    addUtterancesScript(commentsBox, repo, label, issueTerm, theme, false);
  });

  return <div id="commentsBox" />;
}
