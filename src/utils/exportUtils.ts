/**
 * Shared text export, clipboard copy, and WhatsApp/native share utilities
 */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function downloadTextAsFile(text: string, filenamePrefix: string): boolean {
  if (!text || !text.trim()) return false;
  try {
    const safePrefix = filenamePrefix
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'creatorkit-export';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safePrefix}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch {
    return false;
  }
}

export function getWhatsAppShareUrl(text: string): string {
  const trimmed = text.trim();
  return `https://wa.me/?text=${encodeURIComponent(trimmed)}`;
}

export async function shareTextNativeOrCopy(
  title: string,
  text: string
): Promise<'shared' | 'copied' | 'failed'> {
  if (!text || !text.trim()) return 'failed';
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return 'shared';
      }
      // Fall back to clipboard if Web Share API is blocked in iframe
    }
  }
  const copied = await copyTextToClipboard(text);
  return copied ? 'copied' : 'failed';
}
