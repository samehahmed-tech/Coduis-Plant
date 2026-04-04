import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';

interface FileDropzoneProps {
    onFiles: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // MB
    label?: string;
}

/**
 * Drag-and-drop file upload zone.
 *
 * Usage:
 *   <FileDropzone onFiles={handleFiles} accept="image/*" maxSize={5} label="Drop images here" />
 */
const FileDropzone: React.FC<FileDropzoneProps> = ({
    onFiles, accept, multiple = false, maxSize = 10, label,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((fileList: FileList) => {
        const arr = Array.from(fileList).filter(f => f.size <= maxSize * 1024 * 1024);
        setFiles(arr);
        onFiles(arr);
    }, [maxSize, onFiles]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const removeFile = (index: number) => {
        const next = files.filter((_, i) => i !== index);
        setFiles(next);
        onFiles(next);
    };

    return (
        <div>
            <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/50 hover:border-primary/30 hover:bg-elevated/20'}`}
            >
                <input ref={inputRef} type="file" accept={accept} multiple={multiple}
                    onChange={e => e.target.files && handleFiles(e.target.files)}
                    className="hidden" />
                <Upload size={24} className={`mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-muted'}`} />
                <p className="text-xs font-bold text-main">{label || 'Drop files here or click to browse'}</p>
                <p className="text-[9px] text-muted mt-1">Max {maxSize}MB{accept ? ` · ${accept}` : ''}</p>
            </div>

            {files.length > 0 && (
                <div className="mt-3 space-y-2">
                    {files.map((file, i) => (
                        <div key={`${file.name}-${i}`} className="flex items-center gap-2 p-2.5 bg-elevated/40 rounded-xl border border-border/30">
                            <FileIcon size={14} className="text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-main truncate">{file.name}</p>
                                <p className="text-[8px] text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => removeFile(i)} className="p-1 text-muted hover:text-rose-500 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileDropzone;
