/**
 * Download a CSV export from the backend.
 * Uses raw fetch with Bearer token to bypass axios response interceptor.
 */
export async function downloadCSV(endpoint, filename) {
  const token = localStorage.getItem('token');
  const baseURL = import.meta.env.VITE_API_URL || '/api';
  const url = `${baseURL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    throw new Error('Không thể tải xuống file. Vui lòng thử lại.');
  }
}
