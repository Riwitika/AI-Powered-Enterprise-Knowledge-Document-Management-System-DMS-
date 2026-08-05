/**
 * Browser-native HTML Sanitizer
 * Strips dangerous HTML tags, inline events, and protocols (XSS mitigation)
 * while preserving formatting elements (p, span, div, strong, table, etc.).
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Use browser's native DOMParser to parse HTML content
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Recursively clean all elements
  const cleanNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      
      // 1. Remove dangerous tag types
      const dangerousTags = [
        'script', 'iframe', 'object', 'embed', 'style', 'link', 
        'meta', 'applet', 'form', 'input', 'button', 'svg', 
        'math', 'frameset', 'frame', 'noscript', 'base'
      ];
      
      if (dangerousTags.includes(el.tagName.toLowerCase())) {
        el.remove();
        return;
      }
      
      // 2. Remove dangerous attributes and event handlers
      const attributes = Array.from(el.attributes);
      for (const attr of attributes) {
        const name = attr.name.toLowerCase();
        const value = attr.value.toLowerCase().trim();
        
        // Remove event handlers (e.g. onclick, onerror, onload)
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }
        
        // Remove dangerous protocols
        if (
          value.startsWith('javascript:') || 
          value.startsWith('data:text/html') || 
          value.startsWith('vbscript:')
        ) {
          el.removeAttribute(attr.name);
          continue;
        }
        
        // Remove formaction redirection vulnerabilities
        if (name === 'formaction') {
          el.removeAttribute(attr.name);
        }
      }
    }
    
    // Process child nodes recursively
    const children = Array.from(node.childNodes);
    for (const child of children) {
      cleanNode(child);
    }
  };
  
  cleanNode(doc.body);
  return doc.body.innerHTML;
}
