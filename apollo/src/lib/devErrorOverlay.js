/**
 * Dev Error Overlay — floating panel replacement for webpack's full-page overlays.
 *
 * Replaces:
 *   1. webpack-dev-server's compilation error overlay (devServer.client.overlay)
 *   2. @pmmmwh/react-refresh-webpack-plugin's runtime error overlay
 *
 * This is plain JS (no React dependency) so it works even when React is broken.
 * Import this module as early as possible in src/index.js.
 *
 * Errors appear as a floating, dismissible panel in the bottom-right corner.
 * The panel can be minimized to a small badge or dismissed entirely.
 * Compilation errors auto-clear when the next successful build completes.
 *
 * Also exposes window.__devErrorOverlay = { addError, clearErrors } so that
 * the React DevErrorBoundary (or any other code) can report errors into the
 * same panel.
 */

// Only run in development
if (process.env.NODE_ENV === 'development') {
  (function initDevErrorOverlay() {
    let containerEl = null;
    let errors = [];
    let isMinimized = false;
    let isDismissed = false; // user explicitly closed; don't re-show until new error

    // ─── Helpers ───────────────────────────────────────────────

    function escapeHtml(text) {
      const el = document.createElement('span');
      el.textContent = text;
      return el.innerHTML;
    }

    // Strip ANSI escape codes that webpack sometimes includes
    function stripAnsi(str) {
      // eslint-disable-next-line no-control-regex
      return str.replace(/\u001b\[[0-9;]*m/g, '');
    }

    // ─── DOM rendering ─────────────────────────────────────────

    function ensureContainer() {
      if (containerEl && document.body.contains(containerEl)) return containerEl;

      containerEl = document.createElement('div');
      containerEl.id = 'dev-error-overlay';
      containerEl.setAttribute('data-dev-overlay', 'true');

      // Base styles for the floating panel
      Object.assign(containerEl.style, {
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '520px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '420px',
        zIndex: '2147483647', // max z-index
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, monospace",
        fontSize: '13px',
        lineHeight: '1.5',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(231, 76, 60, 0.4)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        opacity: '0',
        transform: 'translateY(8px)',
      });

      document.body.appendChild(containerEl);

      // Animate in
      requestAnimationFrame(() => {
        containerEl.style.opacity = '1';
        containerEl.style.transform = 'translateY(0)';
      });

      return containerEl;
    }

    function removeContainer() {
      if (containerEl) {
        containerEl.style.opacity = '0';
        containerEl.style.transform = 'translateY(8px)';
        const el = containerEl;
        setTimeout(() => el.remove(), 160);
        containerEl = null;
      }
    }

    function render() {
      // Nothing to show
      if (errors.length === 0 || isDismissed) {
        removeContainer();
        return;
      }

      const panel = ensureContainer();

      // ─── Minimized view (just a badge) ───
      if (isMinimized) {
        panel.style.maxHeight = 'none';
        panel.style.overflow = 'hidden';
        panel.innerHTML = `
          <div style="
            display: flex; align-items: center; gap: 8px;
            padding: 8px 14px; cursor: pointer;
            background: linear-gradient(135deg, #c0392b, #e74c3c);
            color: #fff; font-weight: 600; font-size: 12px;
            border-radius: 10px;
            user-select: none;
          ">
            <span style="font-size: 14px;">&#9888;</span>
            <span>${errors.length} error${errors.length !== 1 ? 's' : ''}</span>
            <span style="opacity: 0.7; margin-left: auto; font-weight: 400;">click to expand</span>
          </div>
        `;
        panel.querySelector('div').onclick = () => { isMinimized = false; render(); };
        return;
      }

      // ─── Expanded view ───
      panel.style.maxHeight = '420px';
      panel.style.overflow = 'hidden';
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';

      const headerColor = errors.some(e => e.type.includes('Error'))
        ? 'linear-gradient(135deg, #c0392b, #e74c3c)'
        : 'linear-gradient(135deg, #e67e22, #f39c12)';

      const errorsHtml = errors.map((err, i) => {
        const isCompilation = err.type.includes('Compilation');
        const labelColor = err.type.includes('Warning') ? '#f39c12' : '#e74c3c';
        return `
          <div style="
            padding: 12px 14px;
            ${i < errors.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.08);' : ''}
          ">
            <div style="
              display: flex; align-items: center; gap: 6px;
              margin-bottom: 6px; font-size: 11px; font-weight: 600;
              text-transform: uppercase; letter-spacing: 0.5px;
              color: ${labelColor};
            ">
              <span>${escapeHtml(err.type)}</span>
            </div>
            <pre style="
              margin: 0; white-space: pre-wrap; word-break: break-word;
              color: #e8e8e8; font-size: 12px; line-height: 1.6;
              ${isCompilation ? 'max-height: 200px; overflow-y: auto;' : ''}
            ">${escapeHtml(err.message)}</pre>
          </div>
        `;
      }).join('');

      panel.innerHTML = `
        <div style="
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px 8px 14px;
          background: ${headerColor};
          color: #fff; font-weight: 600; font-size: 12px;
          user-select: none; flex-shrink: 0;
        ">
          <span>&#9888; ${errors.length} error${errors.length !== 1 ? 's' : ''}</span>
          <div style="display: flex; gap: 2px;">
            <button data-action="copy" title="Copy all errors" style="
              background: rgba(255,255,255,0.15); border: none; color: #fff;
              cursor: pointer; font-size: 12px; line-height: 1;
              height: 26px; border-radius: 6px; padding: 0 8px;
              display: flex; align-items: center; gap: 4px;
              font-family: inherit; font-weight: 500;
            ">&#128203; Copy</button>
            <button data-action="minimize" title="Minimize" style="
              background: rgba(255,255,255,0.15); border: none; color: #fff;
              cursor: pointer; font-size: 16px; line-height: 1;
              width: 26px; height: 26px; border-radius: 6px;
              display: flex; align-items: center; justify-content: center;
            ">&minus;</button>
            <button data-action="dismiss" title="Dismiss" style="
              background: rgba(255,255,255,0.15); border: none; color: #fff;
              cursor: pointer; font-size: 16px; line-height: 1;
              width: 26px; height: 26px; border-radius: 6px;
              display: flex; align-items: center; justify-content: center;
            ">&times;</button>
          </div>
        </div>
        <div style="
          padding: 6px 14px;
          background: #16162a;
          color: #8b949e;
          font-size: 11px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        ">
          Copy and paste this to your AI assistant &mdash; it can likely fix it.
        </div>
        <div style="
          flex: 1; overflow-y: auto;
          background: #1a1a2e;
        ">
          ${errorsHtml}
        </div>
      `;

      panel.querySelector('[data-action="copy"]').onclick = () => {
        const text = errors.map(e => `[${e.type}]\n${e.message}`).join('\n\n---\n\n');
        navigator.clipboard.writeText(text).then(() => {
          const btn = panel.querySelector('[data-action="copy"]');
          const original = btn.innerHTML;
          btn.innerHTML = '&#10003; Copied';
          btn.style.background = 'rgba(35, 134, 54, 0.6)';
          setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = 'rgba(255,255,255,0.15)';
          }, 1500);
        });
      };
      panel.querySelector('[data-action="minimize"]').onclick = () => {
        isMinimized = true;
        render();
      };
      panel.querySelector('[data-action="dismiss"]').onclick = () => {
        isDismissed = true;
        render();
      };
    }

    // ─── Public API ────────────────────────────────────────────

    function addError(type, message) {
      const cleaned = stripAnsi(String(message));
      // Deduplicate
      if (errors.some(e => e.type === type && e.message === cleaned)) return;

      errors.push({ type, message: cleaned });
      isDismissed = false; // new error overrides dismiss
      isMinimized = false;
      render();
    }

    function clearErrors(type) {
      if (type) {
        errors = errors.filter(e => e.type !== type);
      } else {
        errors = [];
      }
      render();
    }

    // ─── 1. Webpack Dev Server compilation errors via WebSocket ─

    function connectToWDS() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const url = `${protocol}://${window.location.host}/ws`;
        const ws = new WebSocket(url);

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'errors' && Array.isArray(msg.data)) {
              clearErrors('Compilation Error');
              msg.data.forEach((err) => {
                addError('Compilation Error', typeof err === 'string' ? err : JSON.stringify(err));
              });
            } else if (msg.type === 'warnings' && Array.isArray(msg.data)) {
              clearErrors('Compilation Warning');
              msg.data.forEach((warn) => {
                addError('Compilation Warning', typeof warn === 'string' ? warn : JSON.stringify(warn));
              });
            } else if (msg.type === 'ok' || msg.type === 'still-ok') {
              // Successful compilation — clear build errors
              clearErrors('Compilation Error');
              clearErrors('Compilation Warning');
            }
          } catch (_) {
            // Ignore unparseable messages
          }
        };

        ws.onclose = () => {
          // Reconnect after a delay (server might be restarting)
          setTimeout(connectToWDS, 3000);
        };

        ws.onerror = () => {
          // Will trigger onclose
        };
      } catch (_) {
        // WebSocket unavailable; compilation errors will only appear in console
      }
    }

    // ─── 2. Uncaught runtime errors ────────────────────────────

    window.addEventListener('error', (event) => {
      // Ignore errors from scripts we don't control (e.g., extensions)
      if (event.filename && !event.filename.includes(window.location.host)) return;
      const message = event.error
        ? `${event.error.message}\n\n${event.error.stack || ''}`
        : event.message || 'Unknown error';
      addError('Runtime Error', message);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error
        ? `${reason.message}\n\n${reason.stack || ''}`
        : String(reason);
      addError('Unhandled Promise Rejection', message);
    });

    // ─── Boot ──────────────────────────────────────────────────

    connectToWDS();

    // Expose so React's DevErrorBoundary (and other code) can report errors
    window.__devErrorOverlay = { addError, clearErrors };
  })();
}
