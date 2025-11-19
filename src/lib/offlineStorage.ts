interface ComplaintDraft {
  id: string;
  subject: string;
  description: string;
  category_id: string;
  priority_id: string;
  channel: string;
  timestamp: number;
}

interface QueuedMessage {
  id: string;
  message: string;
  parent_id?: string;
  timestamp: number;
}

const DRAFTS_KEY = "complaint_drafts";
const MESSAGES_QUEUE_KEY = "messages_queue";

export const offlineStorage = {
  // Complaint Drafts
  saveDraft: (draft: Omit<ComplaintDraft, "id" | "timestamp">) => {
    const drafts = offlineStorage.getDrafts();
    const newDraft: ComplaintDraft = {
      ...draft,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    drafts.push(newDraft);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return newDraft;
  },

  getDrafts: (): ComplaintDraft[] => {
    const drafts = localStorage.getItem(DRAFTS_KEY);
    return drafts ? JSON.parse(drafts) : [];
  },

  removeDraft: (id: string) => {
    const drafts = offlineStorage.getDrafts().filter((d) => d.id !== id);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  },

  clearDrafts: () => {
    localStorage.removeItem(DRAFTS_KEY);
  },

  // Message Queue
  queueMessage: (message: Omit<QueuedMessage, "id" | "timestamp">) => {
    const queue = offlineStorage.getMessageQueue();
    const newMessage: QueuedMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    queue.push(newMessage);
    localStorage.setItem(MESSAGES_QUEUE_KEY, JSON.stringify(queue));
    return newMessage;
  },

  getMessageQueue: (): QueuedMessage[] => {
    const queue = localStorage.getItem(MESSAGES_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  },

  removeQueuedMessage: (id: string) => {
    const queue = offlineStorage.getMessageQueue().filter((m) => m.id !== id);
    localStorage.setItem(MESSAGES_QUEUE_KEY, JSON.stringify(queue));
  },

  clearMessageQueue: () => {
    localStorage.removeItem(MESSAGES_QUEUE_KEY);
  },

  // Connection Status
  isOnline: (): boolean => {
    return navigator.onLine;
  },

  // Sync pending items
  syncPendingItems: async (
    onComplaintSync: (draft: ComplaintDraft) => Promise<void>,
    onMessageSync: (message: QueuedMessage) => Promise<void>
  ) => {
    if (!offlineStorage.isOnline()) {
      console.log("Cannot sync: Offline");
      return;
    }

    const drafts = offlineStorage.getDrafts();
    const messages = offlineStorage.getMessageQueue();

    console.log(`Syncing ${drafts.length} drafts and ${messages.length} messages`);

    // Sync complaints
    for (const draft of drafts) {
      try {
        await onComplaintSync(draft);
        offlineStorage.removeDraft(draft.id);
      } catch (error) {
        console.error("Failed to sync draft:", error);
      }
    }

    // Sync messages
    for (const message of messages) {
      try {
        await onMessageSync(message);
        offlineStorage.removeQueuedMessage(message.id);
      } catch (error) {
        console.error("Failed to sync message:", error);
      }
    }
  },
};
