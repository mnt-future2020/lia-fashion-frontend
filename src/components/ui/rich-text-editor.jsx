"use client"

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Label } from "@/components/ui/label"

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

// Import Quill styles
import 'react-quill/dist/quill.snow.css'

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Enter description...", 
  label = "Description",
  className = "",
  error = "",
  id = "rich-text-editor"
}) => {
  const [editorHtml, setEditorHtml] = useState(value || '')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setEditorHtml(value || '')
  }, [value])

  const handleChange = (content) => {
    setEditorHtml(content)
    if (onChange) {
      onChange(content)
    }
  }

  // Custom toolbar configuration with comprehensive options
  const modules = {
    toolbar: [
      [{ 'font': [] }], // Font family
      [{ 'size': ['small', false, 'large', 'huge'] }], // Font size
      ['bold', 'italic', 'underline', 'strike'], // Text formatting
      [{ 'color': [] }, { 'background': [] }], // Text and background color
      [{ 'align': [] }], // Text alignment
      [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Lists
      [{ 'indent': '-1'}, { 'indent': '+1' }], // Indent
      ['blockquote', 'code-block'], // Quote and code
      ['link', 'image'], // Links and images
      ['clean'] // Remove formatting
    ],
  }

  const formats = [
    'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link', 'image'
  ]

  if (!isClient) {
    return (
      <div className="mb-4">
        <Label htmlFor={id}>{label}</Label>
        <div className="min-h-[200px] border border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center justify-center">
          <span className="text-gray-500">Loading editor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`mb-4 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className={`rich-text-editor-wrapper ${error ? 'border-red-500' : ''}`}>
        <ReactQuill
          theme="snow"
          value={editorHtml}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{
            minHeight: '200px',
            border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}
        />
      </div>
      {error && <span className="text-red-500 text-sm mt-1 block">{error}</span>}
      
      <style jsx global>{`
        .rich-text-editor-wrapper .ql-editor {
          min-height: 160px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .rich-text-editor-wrapper .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-bottom: 1px solid #d1d5db;
        }
        
        .rich-text-editor-wrapper .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        
        .rich-text-editor-wrapper .ql-toolbar .ql-formats {
          margin-right: 15px;
        }
        
        .rich-text-editor-wrapper .ql-toolbar button {
          padding: 5px;
          margin: 2px;
          border-radius: 3px;
        }
        
        .rich-text-editor-wrapper .ql-toolbar button:hover {
          background-color: #f3f4f6;
        }
        
        .rich-text-editor-wrapper .ql-toolbar button.ql-active {
          background-color: #eb1c75;
          color: white;
        }
        
        .rich-text-editor-wrapper .ql-picker-label:hover {
          background-color: #f3f4f6;
        }
        
        .rich-text-editor-wrapper .ql-picker.ql-expanded .ql-picker-label {
          background-color: #eb1c75;
          color: white;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor 