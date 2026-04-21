import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import "../css/contactinfo.css";

const ContactInfo = ({ user, messages, onClose }) => {
  const [activeTab, setActiveTab] = useState("media");
  const [previewIndex, setPreviewIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const touchStartX = useRef(null);

  /* ================= ESC CLOSE ================= */
  useEffect(() => {
  const blockedUsers =
    JSON.parse(localStorage.getItem("blockedUsers")) || [];

  setIsBlocked(blockedUsers.includes(user?._id));
}, [user]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setPreviewIndex(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (!user) return null;
  const isAIUser =
  String(user?._id).trim() ===
  String(process.env.REACT_APP_AI_USER_ID).trim();

console.log("user id:", user?._id);
console.log("ai id:", process.env.REACT_APP_AI_USER_ID);
console.log("isAIUser:", isAIUser);
  // ghhg
    const handleDownload = async (url, filename = "file") => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Download failed", err);
  }
};

  /* ================= FILTER ================= */

  const media = messages.filter(
    (m) =>
      m.mediaType?.startsWith("image") ||
      m.mediaType?.startsWith("video")
  );

  const documents = messages.filter(
    (m) =>
      m.mediaType &&
      !m.mediaType.startsWith("image") &&
      !m.mediaType.startsWith("video")
  );

  const links = messages.filter((m) =>
    m.content?.includes("http")
  );

  /* ================= INFINITE SCROLL ================= */

  const loadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const visibleMedia = media.slice(0, visibleCount);

  /* ================= PREVIEW NAVIGATION ================= */

  const goNext = () => {
    if (previewIndex < media.length - 1) {
      setPreviewIndex(previewIndex + 1);
      setZoom(1);
    }
  };

  const goPrev = () => {
    if (previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
      setZoom(1);
    }
  };

  /* ================= SWIPE SUPPORT ================= */

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff =
      touchStartX.current - e.changedTouches[0].clientX;

    if (diff > 50) goNext();
    if (diff < -50) goPrev();
  };

  /* ================= BLOCK USER ================= */

  const handleBlockToggle = async () => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    };

    let blockedUsers =
      JSON.parse(localStorage.getItem("blockedUsers")) || [];

    if (!isBlocked) {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/users/block`,
        { userIdToBlock: user._id },
        config
      );

      setIsBlocked(true);

      if (!blockedUsers.includes(user._id)) {
        blockedUsers.push(user._id);
      }
    } else {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/users/unblock`,
        { userIdToUnblock: user._id },
        config
      );

      setIsBlocked(false);

      blockedUsers = blockedUsers.filter(
        (id) => id !== user._id
      );
    }

    localStorage.setItem(
      "blockedUsers",
      JSON.stringify(blockedUsers)
    );

    setShowConfirm(false);
  } catch (err) {
    console.log(err.response?.data || err.message);

    setShowConfirm(false);
  }
};
 return createPortal(
  <>
    {/* OVERLAY */}
    <div className="contact-overlay" onClick={onClose}></div>

    {/* SIDE PANEL */}
    <div className="contact-info-panel">

      {/* HEADER */}
      <div className="contact-header">
        <h4>Contact Info</h4>
        <button className="close-contact-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* PROFILE */}
      <div className="contact-profile">
        <img
          src={user.profilePic}
          alt="profile"
          className="contact-profile-pic"
        />
        <h5>{user.name}</h5>
        <p>{user.phone}</p>
        <p>{user.bio || "No bio available"}</p>
      </div>

      {/* TABS */}
      <div className="contact-tabs">
        <button
          className={activeTab === "media" ? "active" : ""}
          onClick={() => setActiveTab("media")}
        >
          Media ({media.length})
        </button>

        <button
          className={activeTab === "docs" ? "active" : ""}
          onClick={() => setActiveTab("docs")}
        >
          Docs ({documents.length})
        </button>

        <button
          className={activeTab === "links" ? "active" : ""}
          onClick={() => setActiveTab("links")}
        >
          Links ({links.length})
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="contact-tab-content">

        {/* MEDIA */}
        {activeTab === "media" && (
          <>
            <div className="media-grid">
              {visibleMedia.map((m, index) => (
                <div
                  key={m._id}
                  className="media-wrapper"
                  onClick={() => setPreviewIndex(index)}
                >
                  {m.mediaType.startsWith("image") ? (
                    <img
                      src={m.mediaUrl}
                      alt="media"
                      className="media-item"
                    />
                  ) : (
                    <video
                      src={m.mediaUrl}
                      className="media-item"
                      muted
                    />
                  )}
                </div>
              ))}
            </div>

            {visibleCount < media.length && (
              <button className="load-more-btn" onClick={loadMore}>
                Load More
              </button>
            )}
          </>
        )}

        {/* DOCS */}
        {activeTab === "docs" &&
          documents.map((m) => (
            <div key={m._id}>
              <a href={m.mediaUrl} target="_blank" rel="noreferrer">
                📎 {m.mediaName}
              </a>
            </div>
          ))}

        {/* LINKS */}
        {activeTab === "links" &&
          links.map((m) => (
            <div key={m._id} className="link-card">
              <a href={m.content} target="_blank" rel="noreferrer">
                <div className="link-url">{m.content}</div>
                <small>
                  {new Date(m.createdAt).toLocaleString()}
                </small>
              </a>
            </div>
          ))}
      </div>

      {/* BLOCK BUTTON */}
      
{!isAIUser && (
  <div style={{ marginTop: "20px", textAlign: "center" }}>
    <button
      className={`block-btn ${isBlocked ? "unblock-btn" : ""}`}
      onClick={() => setShowConfirm(true)}
    >
      {isBlocked
        ? `✅ Unblock ${user.name}`
        : `🚫 Block ${user.name}`}
    </button>
  </div>
)}
    </div>

    {/* PREVIEW MODAL */}
    {previewIndex !== null && (
      <div className="media-preview-overlay">

        {/* CLOSE */}
        <button
          className="close-preview"
          onClick={() => {
            setPreviewIndex(null);
            setZoom(1);
          }}
        >
          ✕
        </button>

        {/* DOWNLOAD */}
        <button
          className="download-icon-btn"
          onClick={() =>
            handleDownload(
              media[previewIndex]?.mediaUrl,
              media[previewIndex]?.mediaName || "media"
            )
          }
        >
          ⬇
        </button>

        {/* LEFT */}
        <button
          className="nav-btn left"
          onClick={() =>
            setPreviewIndex((prev) =>
              prev > 0 ? prev - 1 : media.length - 1
            )
          }
        >
          ◀
        </button>

        {/* RIGHT */}
        <button
          className="nav-btn right"
          onClick={() =>
            setPreviewIndex((prev) =>
              prev < media.length - 1 ? prev + 1 : 0
            )
          }
        >
          ▶
        </button>

        {/* MEDIA */}
        <div
          className="preview-content"
          onWheel={(e) => {
            if (e.deltaY < 0) {
              setZoom((z) => Math.min(z + 0.2, 3));
            } else {
              setZoom((z) => Math.max(z - 0.2, 1));
            }
          }}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const diff =
              touchStartX.current - e.changedTouches[0].clientX;

            if (diff > 50) {
              setPreviewIndex((prev) =>
                prev < media.length - 1 ? prev + 1 : 0
              );
            } else if (diff < -50) {
              setPreviewIndex((prev) =>
                prev > 0 ? prev - 1 : media.length - 1
              );
            }
          }}
        >
          {media[previewIndex]?.mediaType.startsWith("image") ? (
            <img
              src={media[previewIndex].mediaUrl}
              style={{
                transform: `scale(${zoom})`,
                transition: "0.2s",
                maxWidth: "90%",
                maxHeight: "90%",
              }}
              alt=""
            />
          ) : (
            <video
              src={media[previewIndex].mediaUrl}
              controls
              autoPlay
              style={{ maxWidth: "90%", maxHeight: "90%" }}
            />
          )}
        </div>
      </div>
    )}
    {showConfirm && (
  <div className="confirm-overlay">
    <div className="confirm-box">
      <h5>
        {isBlocked
          ? "Unblock this user?"
          : "Are you sure you want to block this user?"}
      </h5>

      <div className="confirm-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowConfirm(false)}
        >
          Cancel
        </button>

        <button
          className="btn btn-danger btn-sm"
          onClick={handleBlockToggle}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
)}
  </>,
  document.body
);
};

export default ContactInfo;
