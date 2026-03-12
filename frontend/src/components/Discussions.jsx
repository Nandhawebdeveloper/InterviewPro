import { useState, useEffect } from "react";
import endpoints from "../services/endpoints";

const Discussions = ({ questionId }) => {
  const [discussions, setDiscussions] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (questionId) loadDiscussions();
  }, [questionId]);

  const loadDiscussions = async () => {
    setLoading(true);
    const res = await endpoints.getDiscussions(questionId);
    if (res.success) {
      setDiscussions(res.data.discussions || []);
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const res = await endpoints.postDiscussion(questionId, newComment.trim());
    if (res.success) {
      setNewComment("");
      loadDiscussions();
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const res = await endpoints.postDiscussion(questionId, replyText.trim(), parentId);
    if (res.success) {
      setReplyText("");
      setReplyTo(null);
      loadDiscussions();
    }
    setSubmitting(false);
  };

  const handleUpvote = async (discussionId) => {
    const res = await endpoints.upvoteDiscussion(discussionId);
    if (res.success) {
      loadDiscussions();
    }
  };

  const handleDelete = async (discussionId) => {
    const res = await endpoints.deleteDiscussion(discussionId);
    if (res.success) {
      loadDiscussions();
    }
  };

  const renderComment = (comment, depth = 0) => (
    <div
      key={comment.id}
      className={`discussion-comment ${depth > 0 ? "discussion-reply" : ""}`}
      style={{ marginLeft: depth * 24 }}
    >
      <div className="discussion-comment-header">
        <span className="discussion-author">👤 {comment.user_name || "User"}</span>
        <span className="discussion-time">{new Date(comment.created_at).toLocaleDateString()}</span>
      </div>
      <p className="discussion-text">{comment.comment}</p>
      <div className="discussion-actions">
        <button className="btn-link" onClick={() => handleUpvote(comment.id)}>
          👍 {comment.upvotes || 0}
        </button>
        <button className="btn-link" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
          💬 Reply
        </button>
        <button className="btn-link btn-danger-link" onClick={() => handleDelete(comment.id)}>
          🗑️
        </button>
      </div>

      {replyTo === comment.id && (
        <div className="discussion-reply-form">
          <textarea
            className="form-control"
            rows={2}
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="discussion-reply-actions">
            <button className="btn btn-sm btn-primary" onClick={() => handleReply(comment.id)} disabled={submitting}>
              {submitting ? "Posting..." : "Reply"}
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="discussions-section">
      <h3>💬 Discussion ({discussions.length})</h3>

      {/* New comment form */}
      <div className="discussion-form">
        <textarea
          className="form-control"
          rows={3}
          placeholder="Share your thoughts, solution, or ask a question..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={2000}
        />
        <button className="btn btn-primary" onClick={handlePost} disabled={submitting || !newComment.trim()}>
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </div>

      {/* Comments list */}
      <div className="discussion-list">
        {discussions.length === 0 ? (
          <div className="empty-state">
            <p>No discussions yet. Be the first to comment!</p>
          </div>
        ) : (
          discussions.map((d) => renderComment(d))
        )}
      </div>
    </div>
  );
};

export default Discussions;
