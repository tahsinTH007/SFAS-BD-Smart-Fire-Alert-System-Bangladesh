import { useState } from "react";
import type { NotificationDetail, Comment } from "../types/notificationDetail";

export const useNotificationDetail = (initialData: NotificationDetail) => {
  const [data, setData] = useState<NotificationDetail>(initialData);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([
    {
      author: "Cmdr. Rahman A.",
      text: "IC assigned. Ladder crew working on floor 6 rescue. Awaiting foam unit.",
      time: "09:21 AM",
    },
  ]);
  const [copied, setCopied] = useState(false);

  const handleAcknowledge = () => {
    setData((d) => ({ ...d, acknowledged: true, read: true }));
  };

  const handleMarkRead = () => {
    setData((d) => ({ ...d, read: true }));
  };

  const postComment = () => {
    if (!comment.trim()) return;
    setComments((c) => [
      ...c,
      {
        author: "You",
        text: comment.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setComment("");
  };

  const copyIncidentId = () => {
    navigator.clipboard.writeText(data.incidentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return {
    data,
    comment,
    setComment,
    comments,
    copied,
    handleAcknowledge,
    handleMarkRead,
    postComment,
    copyIncidentId,
  };
};
