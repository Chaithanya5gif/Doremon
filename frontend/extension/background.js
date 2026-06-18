// DORAEMON Enforcer Background Script

// In a real production app, this would poll our backend `http://localhost:8000/api/sessions/active`
// to see if Hunter is currently in an active focus session.
// For the prototype, we simulate an active session state.
let isSessionActive = true; 
let activeQuestName = "Fix ScamMotion Upload Bug";

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkStatus") {
    sendResponse({ 
      blocked: isSessionActive, 
      questName: activeQuestName 
    });
  }
  return true;
});
