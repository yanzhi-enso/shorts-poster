import { NextResponse } from 'next/server';

/**
 * Download a file from Google Drive and move it to the Posted folder
 */
export async function POST(request) {
  try {
    const { fileId, fileName, accessToken, parentId } = await request.json();

    if (!fileId || !fileName || !accessToken || !parentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Folder mappings - hardcoded folder IDs from the main page
    const FOLDER_MAPPINGS = {
      '1rhc9L6ISTDbrZ6swO6COQa9gA24dopcT': '1rhc9L6ISTDbrZ6swO6COQa9gA24dopcT/Posted', // One Min Videos
      '1zAH7h3LcquWdF-OEuBI_OeXagRD3rPce': '1zAH7h3LcquWdF-OEuBI_OeXagRD3rPce/Posted', // Shorts Videos
    };

    // Step 1: Find the Posted subfolder for the current parent folder
    let postedFolderId = null;
    
    // Search for "Posted" folder within the parent folder
    const searchQuery = `name='Posted' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Failed to find Posted folder: ${searchResponse.statusText}`);
    }

    const searchResult = await searchResponse.json();
    if (searchResult.files && searchResult.files.length > 0) {
      postedFolderId = searchResult.files[0].id;
    } else {
      throw new Error('Posted folder not found in the parent directory');
    }

    // Step 2: Download the file content
    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download file: ${downloadResponse.statusText}`);
    }

    // Step 3: Move the file to the Posted folder
    const moveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${postedFolderId}&removeParents=${parentId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!moveResponse.ok) {
      throw new Error(`Failed to move file: ${moveResponse.statusText}`);
    }

    // Step 4: Return the file content as response
    const fileBuffer = await downloadResponse.arrayBuffer();
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error in download-and-move API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
