// 🚨 URGENT DEBUG SCRIPT FOR LOGIN REDIRECT
// Add this to browser console for debugging

console.warn('🔥 LOGIN REDIRECT DEBUG SCRIPT LOADED');

// Override window.location to track all redirects
const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
const originalReplace = window.location.replace;

Object.defineProperty(window.location, 'href', {
  set: function(url) {
    console.warn('🚨 REDIRECT ATTEMPT via window.location.href to:', url);
    if (originalHref && originalHref.set) {
      originalHref.set.call(this, url);
    }
  },
  get: function() {
    return originalHref ? originalHref.get.call(this) : '';
  }
});

window.location.replace = function(url) {
  console.warn('🚨 REDIRECT ATTEMPT via window.location.replace to:', url);
  return originalReplace.call(this, url);
};

// Track router.push calls
if (window.next && window.next.router) {
  const originalPush = window.next.router.push;
  window.next.router.push = function(url) {
    console.warn('🚨 REDIRECT ATTEMPT via router.push to:', url);
    return originalPush.call(this, url);
  };
}

console.warn('🔥 DEBUG SCRIPT READY - All redirects will be logged!');
