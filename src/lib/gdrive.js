// ================================
// Google Drive API Utility Functions
// ================================

/**
 * List files in Google Drive
 */
export async function listDriveFiles(accessToken, options = {}) {
  try {
    const params = new URLSearchParams({
      pageSize: options.pageSize || '100',
      fields: 'files(id,name,mimeType,parents,createdTime,modifiedTime,size,webViewLink)',
      ...(options.q && { q: options.q }),
      ...(options.pageToken && { pageToken: options.pageToken })
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list Drive files: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing Drive files:', error);
    throw error;
  }
}

/**
 * Get file content from Google Drive
 */
export async function getDriveFileContent(accessToken, fileId) {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Drive file content: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error getting Drive file content:', error);
    throw error;
  }
}

/**
 * Get file metadata from Google Drive
 */
export async function getDriveFileMetadata(accessToken, fileId) {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=*`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Drive file metadata: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Drive file metadata:', error);
    throw error;
  }
}

/**
 * Create or update a file in Google Drive
 */
export async function uploadToDrive(accessToken, fileName, content, folderId = null, fileId = null) {
  try {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: fileName,
      ...(folderId && { parents: [folderId] })
    };

    let body = delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) + delimiter +
      'Content-Type: text/plain\r\n\r\n' +
      content + close_delim;

    const method = fileId ? 'PATCH' : 'POST';
    const url = fileId 
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`,
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to Drive: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    throw error;
  }
}

/**
 * Search for files in Google Drive
 */
export async function searchDriveFiles(accessToken, query) {
  try {
    return await listDriveFiles(accessToken, { q: query });
  } catch (error) {
    console.error('Error searching Drive files:', error);
    throw error;
  }
}

/**
 * Delete a file from Google Drive
 */
export async function deleteDriveFile(accessToken, fileId) {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete Drive file: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting Drive file:', error);
    throw error;
  }
}

/**
 * Helper function to get files from a specific shared folder
 */
export async function getFilesFromSharedFolder(accessToken, folderName) {
  try {
    // First, search for the folder by name
    const folderQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`;
    const folderResult = await searchDriveFiles(accessToken, folderQuery);
    
    if (!folderResult.files || folderResult.files.length === 0) {
      throw new Error(`Folder '${folderName}' not found`);
    }

    const folderId = folderResult.files[0].id;
    
    // Then get all files in that folder
    const filesQuery = `'${folderId}' in parents and trashed=false`;
    return await searchDriveFiles(accessToken, filesQuery);
  } catch (error) {
    console.error('Error getting files from shared folder:', error);
    throw error;
  }
}
