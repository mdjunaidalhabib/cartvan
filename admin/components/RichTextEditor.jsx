"use client";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading3,
  Heading4,
  Link2,
  Eraser,
  Undo2,
  Redo2,
} from "lucide-react";

const TEXT_COLORS = [
  { name: "ডিফল্ট", value: "" },
  { name: "লাল", value: "#dc2626" },
  { name: "সবুজ", value: "#16a34a" },
  { name: "নীল", value: "#2563eb" },
  { name: "কমলা", value: "#ea580c" },
  { name: "গোলাপি", value: "#db2777" },
  { name: "বেগুনি", value: "#7c3aed" },
];

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? "bg-indigo-600 text-white"
          : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "",
  minHeight = 160,
  error,
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
        link: { openOnClick: false, autolink: true },
      }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-content ProseMirror-admin focus:outline-none",
      },
    },
  });

  // ✅ বাইরে থেকে value পাল্টালে (যেমন প্রোডাক্ট লোড হওয়ার পর) editor sync করা —
  // কিন্তু নিজে টাইপ করার সময় বারবার content reset করে cursor হারানো এড়ানো হয়
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const setColor = (color) => {
    if (!color) editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(color).run();
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("লিংক URL দিন:", prev || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden bg-white transition-all ${
        error ? "border-red-500" : "border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400"
      }`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-gray-50 px-2 py-1.5">
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton
          title="উপশিরোনাম (বড়)"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="উপশিরোনাম (ছোট)"
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <Heading4 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="বুলেট লিস্ট"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="নম্বর লিস্ট"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton title="লিংক যুক্ত করুন" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* রং */}
        <div className="flex items-center gap-1 px-0.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setColor(c.value)}
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-transform hover:scale-110 ${
                editor.isActive("textStyle", { color: c.value })
                  ? "ring-2 ring-offset-1 ring-indigo-500"
                  : "border-gray-300"
              }`}
              style={c.value ? { backgroundColor: c.value, borderColor: c.value } : { background: "#fff" }}
            >
              {!c.value && <span className="text-[9px] font-bold text-gray-400">A</span>}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton
          title="ফরম্যাট মুছুন"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <Eraser size={15} />
        </ToolbarButton>
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={15} />
        </ToolbarButton>
      </div>

      {/* Editable area */}
      <div className="px-4 py-3 text-[15px]" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
