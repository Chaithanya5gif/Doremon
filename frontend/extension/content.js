// Check if we should block this page
chrome.runtime.sendMessage({ action: "checkStatus" }, (response) => {
  if (response && response.blocked) {
    injectBlockingUI(response.questName);
  }
});

function injectBlockingUI(questName) {
  // Stop the page from rendering by hiding the body
  document.documentElement.style.display = 'none';

  // Wait for DOM to be ready to inject our UI
  document.addEventListener('DOMContentLoaded', () => {
    // Hide the actual body content completely
    if (document.body) {
      document.body.innerHTML = ''; 
    }
    document.documentElement.style.display = 'block';
    
    const container = document.createElement('div');
    container.id = 'doraemon-blocker';
    container.innerHTML = `
      <div class="d-overlay"></div>
      <div class="d-panel">
        <div class="d-header">
          <span class="d-cyan">■</span> DORAEMON HAS ACTIVATED FOCUS MODE
        </div>
        
        <div class="d-content">
          <p class="d-gray">You attempted to access a restricted sector.</p>
          
          <div class="d-quest-box">
            <div class="d-label">CURRENT ACTIVE QUEST</div>
            <div class="d-quest-name">${questName}</div>
          </div>
          
          <div class="d-message">
            "This distraction will still exist in 2 hours. This quest won't finish itself. I'm not mad, just disappointed."
          </div>

          <div class="d-actions">
            <button class="d-btn d-btn-primary" id="btn-resume">[ RESUME WORK ]</button>
            <button class="d-btn d-btn-danger" id="btn-emergency">[ I HAVE AN EMERGENCY ]</button>
          </div>
        </div>
      </div>
    `;

    document.documentElement.appendChild(container);

    // Event listeners
    document.getElementById('btn-resume').addEventListener('click', () => {
      // Send them back or close the tab
      window.history.back();
      setTimeout(() => { window.close(); }, 500); // fallback
    });

    document.getElementById('btn-emergency').addEventListener('click', () => {
      // In a full implementation, this would trigger the Negotiation Mode LLM logic
      alert("DORAEMON: What kind of emergency? You have 10 seconds to explain yourself before I lock you out again. (Negotiation mode prototype)");
    });
  });
}
