import React from "react";
import { formatImageUrl } from "@/lib/constants";
import styles from "./CommentSection.module.scss";

interface Comment {
  id: number;
  user: { name: string; avatar: string };
  text: string;
  time: string;
  likes: number;
  replies: Array<any>;
}

interface CommentSectionProps {
  comments: Comment[];
  userAvatar: string;
  onSubmitComment: (e: React.FormEvent) => void;
  createRipple: (e: React.MouseEvent, btn?: HTMLElement) => void;
  isLoading?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  userAvatar,
  onSubmitComment,
  createRipple,
  isLoading = false,
}) => {
  return (
    <section className={`${styles["comments-card"]}`}>
      <h2>
        Bình Luận (
        <span id="comment-count-display">{comments.length}</span>)
      </h2>
      {isLoading && <div className={`${styles["skeleton-line"]}`} />}
      <div className={`${styles["comment-input-row"]}`}>
        <img
          src={
            formatImageUrl(userAvatar) ||
            "/image/header/carbon_user-avatar-filled-alt.svg"
          }
          alt="Your Avatar"
        />
        <form className={`${styles["comment-form"]}`} onSubmit={onSubmitComment}>
          <textarea
            id="comment-input"
            name="comment"
            className={`${styles["comment-input"]}`}
            placeholder="Chia sẻ ý kiến hoặc hỏi người bán..."
          ></textarea>
          <div className={`${styles["comment-submit-wrap"]}`}>
            <button
              type="submit"
              className={`${styles["comment-submit-btn"]} ${styles["ripple-target"]}`}
              onClick={(e) => {
                createRipple(e as any);
              }}
            >
              Gửi Bình Luận
            </button>
          </div>
        </form>
      </div>

      <div id="comment-list" className={`${styles["comment-list"]}`}>
        {comments.map((comment) => (
          <div key={comment.id} className={`${styles["comment-item"]}`}>
            <img src={comment.user.avatar} alt="avatar" />
            <div className={`${styles["comment-content"]}`}>
              <div className={`${styles["comment-box"]}`}>
                <p className={`${styles["author"]}`}>{comment.user.name}</p>
                <p className={`${styles["text"]}`}>{comment.text}</p>
              </div>
              <div className={`${styles["comment-meta"]}`}>
                {comment.time} &nbsp; • &nbsp;{" "}
                <button
                  className={`${styles["meta-action"]}`}
                  onClick={() => {}}
                >
                  Trả lời
                </button>
              </div>
              {comment.replies &&
                comment.replies.map((reply: any) => (
                  <div key={reply.id} className={`${styles["reply-row"]}`}>
                    <img
                      src={reply.user.avatar}
                      alt="reply"
                      className={`${styles["reply-avatar"]}`}
                    />
                    <div className={`${styles["reply-content"]}`}>
                      <div className={`${styles["reply-box"]}`}>
                        <p className={`${styles["author"]}`}>
                          {reply.user.name} <span>(Người bán)</span>
                        </p>
                        <p className={`${styles["text"]}`}>{reply.text}</p>
                      </div>
                      <div className={`${styles["reply-time"]}`}>
                        {reply.time}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CommentSection;
