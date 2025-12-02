/**
 * Dispatch a global cancellable event so pages can respond to voice commands.
 * If nothing handles it, we apply minimal fallbacks (nav/scroll).
 */
export function dispatchVoiceCommand(detail) {
  const event = new CustomEvent('voiceCommand', {
    detail,
    cancelable: true
  });

  const handled = !window.dispatchEvent(event);
  if (handled) return true;

  switch (detail.type) {
    case 'navigate':
      if (detail.target === 'home') window.location.assign('/');
      if (detail.target === 'search') window.location.assign('/search');
      if (detail.target === 'settings') window.location.assign('/settings');
      if (detail.target === 'profile') window.location.assign('/profile');
      if (detail.target === 'back') window.history.back();
      if (detail.target === 'next-page') window.history.forward();
      break;
    case 'scroll':
      window.scrollBy({ top: detail.direction === 'up' ? -400 : 400, behavior: 'smooth' });
      break;
    default:
      break;
  }
  return false;
}
