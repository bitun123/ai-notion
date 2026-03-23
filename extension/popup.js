document.addEventListener('DOMContentLoaded', async () => {
  const saveBtn = document.getElementById('save-btn');
  const retryBtn = document.getElementById('retry-btn');
  const statusEl = document.getElementById('status');
  const successEl = document.getElementById('success');
  const errorEl = document.getElementById('error');
  const pageTypeEl = document.getElementById('page-type');
  const pageTitleEl = document.getElementById('page-title');
  const pageInfoEl = document.getElementById('page-info');

  let currentTab = null;

  async function init() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];

    if (currentTab) {
      const url = currentTab.url;
      const title = currentTab.title;
      
      const type = detectPageType(url);
      pageTypeEl.textContent = type;
      pageTitleEl.textContent = title;
      
      saveBtn.classList.remove('hidden');
    }
  }

  function detectPageType(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) return 'Video';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Tweet';
    if (url.includes('github.com')) return 'Code/Repo';
    if (url.includes('medium.com') || url.includes('substack.com') || url.includes('nytimes.com') || url.includes('theguardian.com')) return 'Article';
    return 'Web Page';
  }

  async function savePage() {
    saveBtn.classList.add('hidden');
    statusEl.classList.remove('hidden');
    successEl.classList.add('hidden');
    errorEl.classList.add('hidden');

    try {
      const response = await fetch('http://localhost:5000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: currentTab.url })
      });

      if (response.ok) {
        statusEl.classList.add('hidden');
        successEl.classList.remove('hidden');
        setTimeout(() => window.close(), 2000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error(err);
      statusEl.classList.add('hidden');
      errorEl.classList.remove('hidden');
    }
  }

  saveBtn.addEventListener('click', savePage);
  retryBtn.addEventListener('click', savePage);

  init();
});
