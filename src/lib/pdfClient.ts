/**
 * BanaSetu Client-Side PDF Utilities
 * Provides separate, dedicated handlers for downloading and sharing PDFs:
 * - Receipts (A5 Collection Receipt)
 * - Tags (A6 Collection Tag & Product Lot Spec Tag)
 * - Audit Dossiers (A4 Chain-of-Custody Dossier)
 *
 * Implements strict security, error handling, offline detection, Blob URL lifecycle,
 * and clear distinction between Download (file download) and Share (Web Share API).
 */

export interface DownloadPdfOptions {
  url: string;
  filename: string;
  onLoadingChange?: (loading: boolean) => void;
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
}

export interface SharePdfOptions {
  url: string;
  filename: string;
  title: string;
  text?: string;
  onLoadingChange?: (loading: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Sanitizes a document identifier into a safe filename.
 */
export function sanitizePdfFilename(prefix: string, identifier: string): string {
  const cleanId = (identifier || 'document')
    .replace(/^#/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${prefix}-${cleanId}.pdf`;
}

/**
 * Downloads a PDF document from an authenticated server endpoint.
 * - Enforces network and authentication checks
 * - Validates PDF MIME type and non-empty response
 * - Generates temporary Blob URL
 * - Triggers native browser file download
 * - Safely revokes Blob URL after trigger
 * - NEVER opens the native share sheet
 */
export async function downloadPdfBlob(options: DownloadPdfOptions): Promise<{ success: boolean; filename: string }> {
  const { url, filename, onLoadingChange, onSuccess, onError } = options;

  onLoadingChange?.(true);

  try {
    // 1. Offline Network Check
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const offlineMsg = 'Network offline: PDF download requires active network connectivity.';
      onError?.(offlineMsg);
      throw new Error(offlineMsg);
    }

    // 2. Authenticated Fetch
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/pdf, application/json',
      },
    });

    // 3. Status Code Specific Error Handling
    if (!response.ok) {
      let serverMessage = '';
      try {
        const errorJson = await response.json();
        serverMessage = errorJson.message || errorJson.error || '';
      } catch {
        // Response was not JSON
      }

      if (response.status === 401) {
        const msg = serverMessage || 'Authentication session expired. Please log in again to download.';
        onError?.(msg);
        throw new Error(msg);
      }

      if (response.status === 403) {
        const msg = serverMessage || 'Access denied: You do not have permission to download this PDF.';
        onError?.(msg);
        throw new Error(msg);
      }

      if (response.status === 429) {
        const msg = serverMessage || 'Rate limit exceeded: Please wait a moment before downloading again.';
        onError?.(msg);
        throw new Error(msg);
      }

      if (response.status === 503) {
        const msg = serverMessage || 'PostgreSQL database is unconfigured. Live PDF generation is currently unavailable.';
        onError?.(msg);
        throw new Error(msg);
      }

      const msg = serverMessage || `Server returned error (${response.status} ${response.statusText})`;
      onError?.(msg);
      throw new Error(msg);
    }

    // 4. Validate Content-Type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf')) {
      const msg = 'Invalid response: Server did not return a valid PDF document.';
      onError?.(msg);
      throw new Error(msg);
    }

    // 5. Read Blob and Verify Content
    const blob = await response.blob();
    if (blob.size === 0) {
      const msg = 'Invalid response: Received empty PDF file from server.';
      onError?.(msg);
      throw new Error(msg);
    }

    // 6. Resolve Target Filename (from header or parameter)
    let finalFilename = filename;
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        finalFilename = match[1].trim();
      }
    }
    if (!finalFilename.toLowerCase().endsWith('.pdf')) {
      finalFilename += '.pdf';
    }

    // 7. Trigger Direct File Download via Blob URL
    if (typeof window !== 'undefined') {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Revoke Object URL safely
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    }

    onSuccess?.(finalFilename);
    return { success: true, filename: finalFilename };
  } catch (err: any) {
    if (!options.onError && err?.message) {
      console.error('PDF Download failed:', err.message);
    }
    throw err;
  } finally {
    onLoadingChange?.(false);
  }
}

/**
 * Shares a PDF document using the Web Share API where supported.
 * If file sharing is supported, fetches the PDF blob and shares as a file.
 * If file sharing is unavailable, falls back gracefully to sharing text or downloading.
 */
export async function sharePdf(options: SharePdfOptions): Promise<{ success: boolean; sharedAsFile: boolean }> {
  const { url, filename, title, text, onLoadingChange, onSuccess, onError } = options;

  onLoadingChange?.(true);

  try {
    // 1. Check if Web Share API is available
    const hasNavigatorShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

    if (!hasNavigatorShare) {
      // Clear fallback: Web Share not supported on this device/browser -> Trigger direct download
      await downloadPdfBlob({
        url,
        filename,
        onError,
        onSuccess: () => {
          onSuccess?.();
        },
      });
      return { success: true, sharedAsFile: false };
    }

    // 2. Attempt File Sharing via Web Share Level 2
    let fileShared = false;
    try {
      if (typeof navigator.canShare === 'function' && typeof File !== 'undefined') {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/pdf' },
        });

        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], filename, { type: 'application/pdf' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title,
              text: text || title,
            });
            fileShared = true;
          }
        }
      }
    } catch (shareFileErr: any) {
      // User cancelled share dialog
      if (shareFileErr?.name === 'AbortError') {
        return { success: false, sharedAsFile: false };
      }
      console.warn('Web Share file sharing failed, falling back to text share:', shareFileErr);
    }

    // 3. Fallback to Text Sharing if File Share wasn't executed
    if (!fileShared) {
      try {
        await navigator.share({
          title,
          text: text || `${title}\nView at: ${url}`,
          url: typeof window !== 'undefined' && window.location ? window.location.href : undefined,
        });
      } catch (textShareErr: any) {
        if (textShareErr?.name === 'AbortError') {
          return { success: false, sharedAsFile: false };
        }
        // If native share threw an unhandled error, fallback to direct download
        await downloadPdfBlob({
          url,
          filename,
          onError,
          onSuccess: () => {
            onSuccess?.();
          },
        });
      }
    }

    onSuccess?.();
    return { success: true, sharedAsFile: fileShared };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, sharedAsFile: false };
    }
    onError?.(err?.message || 'Failed to share PDF');
    throw err;
  } finally {
    onLoadingChange?.(false);
  }
}
