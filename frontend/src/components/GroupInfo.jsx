import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../css/groupinfo.css";
import { createPortal } from "react-dom";

const GroupInfo = ({ group, messages, onClose }) => {
  const [groupData, setGroupData] = useState(group);

  /* 🔹 ADDED STATE */
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(group?.name || "");

  const [activeTab, setActiveTab] = useState("media");
  const [previewIndex, setPreviewIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [visibleCount, setVisibleCount] = useState(12);

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const touchStartX = useRef(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

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

  const loggedInUserId = token
    ? JSON.parse(atob(token.split(".")[1])).userId
    : null;

  useEffect(() => {
    setGroupData(group);
  }, [group]);

  useEffect(() => {
    setNewGroupName(groupData?.name || "");
  }, [groupData]);

  if (!groupData) return null;

  const isAdmin = groupData.admins?.some(
    (a) => a._id === loggedInUserId
  );

  /* 🔹 UPDATE GROUP NAME */
  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim()) return;

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/groups/update-name`,
        {
          groupId: groupData._id,
          name: newGroupName,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGroupData(res.data);
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= REFRESH GROUP ================= */

  const refreshGroup = async () => {
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/groups`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const updated = res.data.find(
      (g) => g._id === groupData._id
    );

    setGroupData(updated);
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

  const visibleMedia = media.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  /* ================= ADMIN ACTIONS ================= */

  const handleRemoveMember = async (userId) => {
    await axios.post(
      `${process.env.REACT_APP_API_URL}/groups/remove-member`,
      { groupId: groupData._id, userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    refreshGroup();
  };

  const handleMakeAdmin = async (userId) => {
    await axios.post(
      `${process.env.REACT_APP_API_URL}/groups/make-admin`,
      { groupId: groupData._id, userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    refreshGroup();
  };

  const handleRemoveAdmin = async (userId) => {
    await axios.post(
      `${process.env.REACT_APP_API_URL}/groups/remove-admin`,
      { groupId: groupData._id, userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    refreshGroup();
  };

  /* ================= ADD MEMBER ================= */

  const openAddPanel = async () => {
  const res = await axios.get(
    `${process.env.REACT_APP_API_URL}/groups/available-users/${groupData._id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // 🔥 Hide AI Assistant
  const filteredUsers = res.data.filter(
    (user) =>
      user.name?.toLowerCase() !== "ai assistant"
  );

  setAvailableUsers(filteredUsers);
  setShowAddPanel(true);
};
 const handleAddMembers = async () => {
  for (let userId of selectedUsers) {
    const selectedUser = availableUsers.find(
      (u) => u._id === userId
    );

    // 🔥 Extra protection
    if (
      selectedUser?.name?.toLowerCase() ===
      "ai assistant"
    ) {
      continue;
    }

    await axios.post(
     ` ${process.env.REACT_APP_API_URL}/groups/add-member`,
      { groupId: groupData._id, userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  setSelectedUsers([]);
  setShowAddPanel(false);
  refreshGroup();
};
  /* ================= GROUP DP ================= */

  const handleGroupPicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("groupId", groupData._id);
    formData.append("file", file);

    await axios.put(
      `${process.env.REACT_APP_API_URL}/groups/update-pic`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    refreshGroup();
  };

  /* ================= EXIT ================= */

  const handleExitGroup = async () => {
    await axios.post(
      `${process.env.REACT_APP_API_URL}/groups/leave`,
      { groupId: groupData._id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    onClose();
  };

  return (
    <>
      <div className="contact-overlay" onClick={onClose}></div>

      <div className="contact-info-panel">
        <div className={`slide-container ${showAddPanel ? "slide" : ""}`}>
          
          {/* ================= MAIN PANEL ================= */}
          <div className="panel main-panel">
            <div className="contact-header">
              <h4>Group Info</h4>
             <button className="close-contact-btn" onClick={onClose}>
  ✕
</button>
            </div>

            <div className="contact-profile">
              <div className="group-dp-wrapper">
                <img
                  src={groupData.groupPic || "/group-default.png"}
                  className="contact-profile-pic"
                />

                {isAdmin && (
                  <>
                    <button
                      className="edit-dp-btn"
                      onClick={() => fileInputRef.current.click()}
                    >
                      ✏
                    </button>
                    <input
                      type="file"
                      hidden
                      ref={fileInputRef}
                      onChange={handleGroupPicChange}
                    />
                  </>
                )}
              </div>

              {/* EDITABLE NAME */}
              {isEditingName ? (
                <div className="edit-name-container">
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="edit-name-input"
                  />
                  <button onClick={handleUpdateGroupName}>Save</button>
                  <button onClick={() => setIsEditingName(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <h5
                  style={{ cursor: isAdmin ? "pointer" : "default" }}
                  onClick={() => isAdmin && setIsEditingName(true)}
                >
                  {groupData.name}
                  {isAdmin && <span style={{ marginLeft: 6 }}>✏</span>}
                </h5>
              )}

              <p>Group · {groupData.members.length} members</p>
              <p>{groupData.description}</p>
            </div>

            {/* MEMBERS */}
            <div className="member-section">
              <h6>Members</h6>

              {groupData.members.map((member) => {
                const memberIsAdmin =
                  groupData.admins.some((a) => a._id === member._id);

                return (
                  <div key={member._id} className="member-row">
                    <div className="member-left">
                      <img src={member.profilePic} alt="" />
                      <span className="member-name">
                        {member.name}
                        
                        {member._id === loggedInUserId && " (You)"}
                        {memberIsAdmin && (
                          <span className="admin-badge">Admin</span>
                        )}
                      </span>
                    </div>

                    {isAdmin &&
                      member._id !== loggedInUserId && (
                        <div className="member-actions">
                          {!memberIsAdmin &&
                            groupData.admins.length < 4 && (
                              <button
                                onClick={() =>
                                  handleMakeAdmin(member._id)
                                }
                              >
                                Make Admin
                              </button>
                            )}

                          {memberIsAdmin && (
                            <button
                              onClick={() =>
                                handleRemoveAdmin(member._id)
                              }
                            >
                              Remove Admin
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleRemoveMember(member._id)
                            }
                          >
                            Remove
                          </button>
                        </div>
                      )}
                  </div>
                );
              })}

              {isAdmin && (
                <button
                  className="add-member-btn"
                  onClick={openAddPanel}
                >
                  ➕ Add Member
                </button>
              )}
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
                            className="media-item"
                            alt=""
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
                    <button onClick={loadMore}>
                      Load More
                    </button>
                    
                  )}
                </>
              )}

              {activeTab === "docs" &&
                documents.map((m) => (
                  <div key={m._id}>
                    <a href={m.mediaUrl}>
                      📎 {m.mediaName}
                    </a>
                    <button
  onClick={() =>
    handleDownload(m.mediaUrl, m.mediaName || "file")
  }
  style={{
    marginLeft: "10px",
    fontSize: "12px",
    cursor: "pointer",
  }}
>
  ⬇️
</button>
                  </div>
                ))}

              {activeTab === "links" &&
                links.map((m) => (
                  <div key={m._id}>
                    <a href={m.content}>
                      {m.content}
                    </a>
                  </div>
                ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                className="block-btn"
                onClick={() => setShowExitConfirm(true)}
              >
                🚪 Exit Group
              </button>
            </div>
          </div>

          {/* ================= ADD PANEL ================= */}
          <div className="panel add-panel">
            <div className="contact-header">
              <button onClick={() => setShowAddPanel(false)}>
                ←
              </button>
              <h4>Add Members</h4>
            </div>

            {availableUsers.map((user) => (
              <label key={user._id}>
                <input
                  type="checkbox"
                  value={user._id}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers([
                        ...selectedUsers,
                        user._id,
                      ]);
                    } else {
                      setSelectedUsers(
                        selectedUsers.filter(
                          (id) => id !== user._id
                        )
                      );
                    }
                  }}
                />
                {user.name}
              </label>
            ))}

            <button onClick={handleAddMembers}>
              Add Selected
            </button>
          </div>

        </div>
      </div>
      {showExitConfirm && (
  <div className="exit-confirm-overlay">
    <div className="exit-confirm-box">
      <h4>Exit Group?</h4>
      <p>Do you want to exit this group?</p>

      <div className="exit-confirm-actions">
        <button
          className="cancel-exit-btn"
          onClick={() => setShowExitConfirm(false)}
        >
          No
        </button>

        <button
          className="yes-exit-btn"
          onClick={handleExitGroup}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
)}
      {/* PREVIEW MODAL */}
    {previewIndex !== null &&
  createPortal(
    <div className="media-preview-overlay">
      <button
        className="close-preview"
        onClick={() => {
          setPreviewIndex(null);
          setZoom(1);
        }}
      >
        ✕
      </button>

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

      <div className="preview-content">
        {media[previewIndex]?.mediaType.startsWith("image") ? (
          <img
            src={media[previewIndex].mediaUrl}
            alt=""
            style={{
              transform: `scale(${zoom})`,
              transition: "0.2s"
            }}
          />
        ) : (
          <video
            src={media[previewIndex].mediaUrl}
            controls
            autoPlay
          />
        )}
      </div>
    </div>,
    document.body
  )}
    </>
  );
};

export default GroupInfo;