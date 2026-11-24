/** Seconds to wait for the SDK's REGISTER before telling the user the widget did not answer. */
export const widgetRegisterTimeoutSeconds = 10

/** Messages the harness posts to whatever embeds it (the browser tab) carry this source. */
export const widgetHarnessMessageSource = 'zoho-studio-widget-harness'

/** Messages the embedding page sends to the harness carry this source. */
export const widgetHarnessControlSource = 'zoho-studio-widget-control'

export interface WidgetHarnessPage {
    sessionId: string
    widgetName: string
    scenarioName?: string
    widgetSrc: string
    pageLoad: Record<string, unknown>
}

/**
 * The page that plays Zoho CRM's parent window: it opens the widget in an iframe, answers the
 * SDK's REGISTER with SET_CONTEXT, sends PageLoad, and relays every CRM_EVENT to the emulator.
 */
export function renderWidgetHarnessPage(page: WidgetHarnessPage): string {
    const config = JSON.stringify({
        ...page,
        timeoutMs: widgetRegisterTimeoutSeconds * 1000,
        messageSource: widgetHarnessMessageSource,
        controlSource: widgetHarnessControlSource,
    }).replace(/</g, '\\u003c')

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(page.widgetName)} — Zoho Studio</title>
<style>
  html, body { margin: 0; height: 100%; font-family: system-ui, sans-serif; }
  #widget { border: 0; width: 100%; height: 100%; display: block; }
  #error { display: none; padding: 16px; background: #fdecea; color: #611a15; border-bottom: 1px solid #f5c2c0; }
</style>
</head>
<body>
<div id="error"></div>
<iframe id="widget" title="${escapeHtml(page.widgetName)}"></iframe>
<script>
const config = ${config};
const frame = document.getElementById('widget');
const widgetOrigin = new URL(config.widgetSrc).origin;
const state = (window.__zohoStudio = { registered: false, ready: false, error: null, sessionId: config.sessionId });

function toParent(type, payload) {
  if (window.parent !== window) {
    window.parent.postMessage({ source: config.messageSource, sessionId: config.sessionId, type, payload }, '*');
  }
}
function toWidget(message) {
  frame.contentWindow.postMessage(message, widgetOrigin);
}
function sendEvent(name, data) {
  toWidget({ type: 'FRAMEWORK.EVENT', eventName: name, data });
}
function showError(message) {
  state.error = message;
  const box = document.getElementById('error');
  box.textContent = message;
  box.style.display = 'block';
  toParent('error', { message });
}

window.addEventListener('message', async (event) => {
  if (event.source === frame.contentWindow) {
    let message = event.data;
    if (typeof message === 'string') { try { message = JSON.parse(message); } catch { return; } }
    if (!message || message.type !== 'SDK.EVENT') return;

    if (message.eventName === 'REGISTER') {
      state.registered = true;
      sendEvent('SET_CONTEXT', { uniqueID: config.sessionId, connectors: {}, model: {} });
      sendEvent('PageLoad', config.pageLoad);
      state.ready = true;
      toParent('ready', { widget: config.widgetName, scenario: config.scenarioName ?? null });
      return;
    }

    if (message.eventName === 'CRM_EVENT' || message.eventName === 'ZDK_EVENT') {
      const response = await fetch('/api/sessions/' + config.sessionId + '/sdk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: message.eventName, data: message.data }),
      }).then((reply) => reply.json());

      if (message.promiseid) {
        toWidget({
          type: 'FRAMEWORK.EVENT',
          eventName: response.ok ? 'EVENT_RESPONSE' : 'EVENT_RESPONSE_FAILURE',
          promiseid: message.promiseid,
          data: response.data,
        });
      }
      toParent('call', response.entry);
    }
    return;
  }

  if (event.source === window.parent && event.data && event.data.source === config.controlSource && event.data.type === 'event') {
    fetch('/api/sessions/' + config.sessionId + '/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: event.data.name, data: event.data.data }),
    });
  }
});

new EventSource('/api/sessions/' + config.sessionId + '/stream').onmessage = (event) => {
  const pushed = JSON.parse(event.data);
  sendEvent(pushed.name, pushed.data);
};

setTimeout(() => {
  if (!state.registered) {
    showError('The widget at ' + config.widgetSrc.split('?')[0] + ' did not answer in ' + (config.timeoutMs / 1000) +
      ' s. Check that it is running and that it loads the Zoho JS SDK and calls ZOHO.embeddedApp.init().');
  }
}, config.timeoutMs);

frame.src = config.widgetSrc;
</script>
</body>
</html>
`
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}
