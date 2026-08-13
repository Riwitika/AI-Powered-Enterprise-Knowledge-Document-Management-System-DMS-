import { api } from '../../api/client';

export interface UploadedAsset {
  url: string;
  filename: string;
  contentType: string;
}

export async function uploadDocumentAsset(
  documentId: string,
  file: File,
): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.append('file', file);
  return api.documents.uploadAsset(documentId, formData);
}
