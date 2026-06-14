import {
  Bold,
  Code2,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder = 'Start writing...',
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && document.activeElement !== editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const emitChange = () => {
    const html = editorRef.current?.innerHTML ?? '';
    onChange(html === '<br>' ? '' : html);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const runCommand = (command: string, commandValue?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, commandValue);
    saveSelection();
    emitChange();
  };

  const addLink = () => {
    const url = window.prompt('Enter the link URL');
    if (url) runCommand('createLink', url);
  };

  const uploadInlineImage = async (file: File) => {
    if (!onUploadImage) return;
    setUploadingImage(true);
    try {
      const url = await onUploadImage(file);
      runCommand('insertImage', url);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const toolbarButton = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    activeDisabled = disabled,
  ) => (
    <button
      type="button"
      className="control-editor-button"
      aria-label={label}
      title={label}
      disabled={activeDisabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={action}
    >
      {icon}
    </button>
  );

  return (
    <div className={`control-rich-editor ${disabled ? 'disabled' : ''}`}>
      <div className="control-editor-toolbar">
        <select
          className="control-editor-format"
          aria-label="Text style"
          disabled={disabled}
          defaultValue="p"
          onChange={(event) => runCommand('formatBlock', event.target.value)}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="pre">Preformatted</option>
        </select>
        <span className="control-editor-divider" />
        {toolbarButton('Bold', <Bold size={15} />, () => runCommand('bold'))}
        {toolbarButton('Italic', <Italic size={15} />, () => runCommand('italic'))}
        {toolbarButton('Underline', <Underline size={15} />, () => runCommand('underline'))}
        {toolbarButton('Inline code', <Code2 size={15} />, () => runCommand('formatBlock', 'pre'))}
        <span className="control-editor-divider" />
        {toolbarButton('Bulleted list', <List size={16} />, () => runCommand('insertUnorderedList'))}
        {toolbarButton('Numbered list', <ListOrdered size={16} />, () => runCommand('insertOrderedList'))}
        {toolbarButton('Blockquote', <Quote size={15} />, () => runCommand('formatBlock', 'blockquote'))}
        {toolbarButton('Paragraph', <Pilcrow size={15} />, () => runCommand('formatBlock', 'p'))}
        <span className="control-editor-divider" />
        {toolbarButton('Insert link', <Link size={15} />, addLink)}
        {onUploadImage
          ? toolbarButton(
              uploadingImage ? 'Uploading image' : 'Insert image',
              <Image size={15} />,
              () => imageInputRef.current?.click(),
              disabled || uploadingImage,
            )
          : null}
        {toolbarButton('Clear formatting', <RemoveFormatting size={15} />, () => runCommand('removeFormat'))}
        <span className="control-editor-divider" />
        {toolbarButton('Undo', <Undo2 size={15} />, () => runCommand('undo'))}
        {toolbarButton('Redo', <Redo2 size={15} />, () => runCommand('redo'))}
      </div>

      <div
        ref={editorRef}
        className="control-editor-content"
        contentEditable={!disabled}
        data-placeholder={placeholder}
        role="textbox"
        aria-label="Post content"
        aria-multiline="true"
        suppressContentEditableWarning
        onBlur={() => {
          saveSelection();
          emitChange();
        }}
        onInput={emitChange}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
      />

      <div className="control-editor-footer">
        <span>Visual editor</span>
        <span>{value.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length} words</span>
      </div>

      {onUploadImage ? (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadInlineImage(file);
          }}
        />
      ) : null}
    </div>
  );
}
