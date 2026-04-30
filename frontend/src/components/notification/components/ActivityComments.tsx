import React from "react";
import { User, Send } from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import type { Comment } from "../types/notificationDetail";

interface ActivityCommentsProps {
  comments: Comment[];
  comment: string;
  setComment: (value: string) => void;
  onPostComment: () => void;
}

export const ActivityComments: React.FC<ActivityCommentsProps> = ({
  comments,
  comment,
  setComment,
  onPostComment,
}) => {
  return (
    <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <User size={14} className="text-slate-500" /> Activity & Comments
        </h2>
      </div>
      <div className="p-5">
        {/* Existing comments */}
        <div className="flex flex-col gap-3">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <User size={13} className="text-slate-500" />
              </div>
              <div className="flex-1 bg-slate-800/50 rounded-lg px-3.5 py-2.5 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-300">
                    {c.author}
                  </span>
                  <span className="text-[10px] text-slate-600">{c.time}</span>
                </div>
                <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment input box */}
        <div className="mt-4 flex gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
            <User size={13} className="text-slate-500" />
          </div>
          <div className="flex-1">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onPostComment();
                }
              }}
              placeholder="Post a comment or update…"
              rows={2}
              className="bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-600 text-[13px] rounded-lg resize-none focus:border-red-800 focus:ring-0"
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={onPostComment}
                disabled={!comment.trim()}
                className="bg-red-600 hover:bg-red-500 text-white text-[12px] gap-1.5 h-8 px-4 rounded-lg disabled:opacity-30"
              >
                <Send size={12} /> Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
