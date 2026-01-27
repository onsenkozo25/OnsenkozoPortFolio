import React, { useCallback, useEffect, useRef, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import Cropper from "react-cropper";
import { fetchWork, fetchWorks, saveWork, uploadFile, deleteWork } from "./api.js";

const emptyContent = [];

const slugify = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "-");

const App = () => {
  const [works, setWorks] = useState([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [contentJson, setContentJson] = useState(emptyContent);
  const [kind, setKind] = useState("did");
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState("");
  const [coverSource, setCoverSource] = useState("");
  const cropperRef = useRef(null);

  const refreshWorks = useCallback(async () => {
    try {
      const data = await fetchWorks();
      setWorks(data);
    } catch (err) {
      setStatus("一覧の取得に失敗しました。");
    }
  }, []);

  useEffect(() => {
    refreshWorks();
  }, [refreshWorks]);

  useEffect(() => {
    return () => {
      if (coverSource) URL.revokeObjectURL(coverSource);
    };
  }, [coverSource]);

  const uploadBlockImage = useCallback(async (file) => {
    const url = await uploadFile(file);
    return url;
  }, []);

  const editor = useCreateBlockNote({
    uploadFile: uploadBlockImage
  });

  const previewEditor = useCreateBlockNote();

  useEffect(() => {
    if (!editor) return;
    editor.replaceBlocks(editor.document, contentJson || []);
  }, [editor, contentJson]);

  useEffect(() => {
    if (!previewEditor) return;
    previewEditor.replaceBlocks(previewEditor.document, contentJson || []);
  }, [previewEditor, contentJson]);

  const handleSelectWork = async (workSlug) => {
    setStatus("読み込み中...");
    try {
      const work = await fetchWork(workSlug);
      setTitle(work.title || "");
      setSlug(work.slug || "");
      setExcerpt(work.excerpt || "");
      setCoverImage(work.coverImage || "");
      setKind(work.kind || "did");
      setTags(work.tags || []);
      setContentJson(work.contentJson || []);
      setStatus("読み込み完了");
    } catch (err) {
      setStatus("読み込みに失敗しました。");
    }
  };

  const handleNew = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setCoverImage("");
    setKind("did");
    setTags([]);
    setContentJson(emptyContent);
    setCoverSource("");
    setStatus("新規作成");
  };

  const handleSave = async () => {
    setStatus("保存中...");
    try {
      const payload = {
        title: title.trim(),
        slug: slugify(slug || title),
        excerpt: excerpt.trim() || null,
        coverImage: coverImage || null,
        kind,
        tags,
        contentJson: contentJson || []
      };
      const saved = await saveWork(payload);
      setSlug(saved.slug || slug);
      setStatus("保存しました。");
      refreshWorks();
    } catch (err) {
      setStatus(err.message || "保存に失敗しました。");
    }
  };

  const handleDelete = async () => {
    if (!slug) {
      setStatus("削除対象が選択されていません。");
      return;
    }
    if (!window.confirm(`「${title}」を削除してもよろしいですか？`)) {
      return;
    }
    setStatus("削除中...");
    try {
      await deleteWork(slug);
      setStatus("削除しました。");
      setTitle("");
      setSlug("");
      setExcerpt("");
      setCoverImage("");
      setKind("did");
      setTags([]);
      setContentJson(emptyContent);
      setCoverSource("");
      refreshWorks();
    } catch (err) {
      setStatus(err.message || "削除に失敗しました。");
    }
  };

  const handleCoverSelect = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (coverSource) URL.revokeObjectURL(coverSource);
    const url = URL.createObjectURL(file);
    setCoverSource(url);
  };

  const toggleTag = (value) => {
    setTags((prev) => {
      if (prev.includes(value)) {
        return prev.filter((tag) => tag !== value);
      }
      return [...prev, value];
    });
  };

  const handleCoverCropUpload = () => {
    const cropper = cropperRef.current && cropperRef.current.cropper;
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
      width: 800,
      height: 800,
      fillColor: "#ffffff"
    });
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const file = new File([blob], `cover-${Date.now()}.jpg`, { type: blob.type });
        const url = await uploadFile(file);
        setCoverImage(url);
        setStatus("カバー画像を更新しました。");
      } catch (err) {
        setStatus("カバー画像のアップロードに失敗しました。");
      }
    }, "image/jpeg");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1>Works CMS</h1>
          <button type="button" onClick={handleNew}>
            新規作成
          </button>
        </div>
        <div className="sidebar-list">
          {works.map((work, index) => (
            <button
              className="work-item"
              type="button"
              key={work.slug || work.id || `work-${index}`}
              onClick={() => handleSelectWork(work.slug)}
            >
              <span className="work-item__title">{work.title}</span>
              <span className="work-item__slug">{work.slug}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="admin-main">
        <div className="form-stack">
          <label>
            タイトル
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="作品タイトル"
            />
          </label>
          <label>
            スラッグ
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="unique-slug"
            />
          </label>
          <label>
            抜粋
            <input
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="一覧表示用の短い説明"
            />
          </label>
          <div className="field-row">
            <span>カテゴリ</span>
            <label className="inline-option">
              <input
                type="radio"
                name="kind"
                value="did"
                checked={kind === "did"}
                onChange={() => setKind("did")}
              />
              やったこと
            </label>
            <label className="inline-option">
              <input
                type="radio"
                name="kind"
                value="made"
                checked={kind === "made"}
                onChange={() => setKind("made")}
              />
              つくったもの
            </label>
          </div>
          <div className="field-row">
            <span>タグ</span>
            {["イラスト", "インターン", "電子工作", "立体造形", "コンテスト"].map((tag) => (
              <label key={tag} className="inline-option">
                <input
                  type="checkbox"
                  value={tag}
                  checked={tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                #{tag}
              </label>
            ))}
          </div>
          <div className="cover-block">
            <div className="cover-row">
              <label>
                カバー画像（正方形トリミング）
                <input type="file" accept="image/*" onChange={handleCoverSelect} />
              </label>
              <button type="button" onClick={handleCoverCropUpload}>
                トリミングして保存
              </button>
            </div>
            {coverSource && (
              <Cropper
                src={coverSource}
                aspectRatio={1}
                guides={true}
                viewMode={1}
                background={false}
                autoCropArea={0.9}
                responsive={true}
                checkCrossOrigin={false}
                minCropBoxHeight={10}
                minCropBoxWidth={10}
                ref={cropperRef}
                className="cover-cropper"
              />
            )}
            {coverImage && (
              <div className="cover-preview">
                <img src={coverImage} alt="cover preview" />
              </div>
            )}
            <p className="cover-note">
              オーバーレイではBlockNote本文内に挿入した元画像が表示されます。
            </p>
          </div>
        </div>

        <div className="editor-wrap">
          <h2>本文</h2>
          <BlockNoteView
            editor={editor}
            onChange={() => setContentJson(editor.document)}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleSave}>
            保存
          </button>
          <button type="button" onClick={handleDelete} style={{ backgroundColor: "#c83e3e" }}>
            削除
          </button>
          <span className="status-text">{status}</span>
        </div>
      </section>

      <section className="admin-preview">
        <h2>プレビュー</h2>
        <BlockNoteView editor={previewEditor} editable={false} />
      </section>
    </div>
  );
};

export default App;
