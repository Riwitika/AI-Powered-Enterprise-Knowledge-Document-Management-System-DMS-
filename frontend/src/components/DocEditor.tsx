import DocxEditor from './DocxEditor';

interface DocEditorProps {
  selectedDocId: string;
  onBackToCatalog: () => void;
  allDocs: any[];
  refetchDocs: () => void;
}

export default function DocEditor({ selectedDocId, allDocs }: DocEditorProps) {
  // Find the active document metadata from allDocs
  const activeDocMeta = allDocs?.find((d: any) => d.id === selectedDocId) || {
    id: selectedDocId,
    name: 'Untitled Document',
    fileType: 'DOCX'
  };

  return <DocxEditor activeDoc={activeDocMeta} />;
}
