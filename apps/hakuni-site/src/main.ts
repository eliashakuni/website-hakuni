// Self-hosted fonts (no requests to Google's servers)
import '@fontsource/fredoka/600.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/400-italic.css';

import './styles.css';

// Keep the copyright year current without editing the HTML every January.
document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
