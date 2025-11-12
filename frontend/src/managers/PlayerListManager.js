import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  getDoc,
  orderBy,
  arrayUnion,
} from "firebase/firestore";
import AuthManager from "./AuthManager";

class PlayerListManager {
  constructor() {
    this.playerListsRef = collection(db, "playerLists");
    this.authInitialized = false;
    this.currentUser = null;

    this.unsubscribeAuth = AuthManager.onAuthStateChanged((user) => {
      this.authInitialized = true;
      this.currentUser = user;
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async waitForAuth() {
    if (this.authInitialized) return;

    return new Promise((resolve) => {
      const unsubscribe = AuthManager.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.authInitialized = true;
        unsubscribe();
        resolve();
      });
    });
  }

  async getUserPlayerLists() {
    await this.waitForAuth();

    const userId = this.currentUser?.uid;
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    try {
      try {
        const q = query(
          this.playerListsRef,
          where("userId", "==", userId),
          orderBy("updatedAt", "desc")
        );

        const snapshot = await getDocs(q);
        return this.processPlayerListDocuments(snapshot);
      } catch (indexError) {
        const q = query(this.playerListsRef, where("userId", "==", userId));

        const snapshot = await getDocs(q);
        const lists = this.processPlayerListDocuments(snapshot);

        return lists.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        });
      }
    } catch (error) {
      console.error("Error in getUserPlayerLists:", error);
      throw new Error(`Failed to fetch player lists: ${error.message}`);
    }
  }

  processPlayerListDocuments(snapshot) {
    return snapshot.docs.map((doc) => {
      const data = doc.data();

      const createdAt =
        data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
      const updatedAt = data.updatedAt?.toDate?.()?.toISOString() || createdAt;

      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
        playerIds: data.playerIds || [],
        name: data.name || "Untitled List",
        description: data.description || "",
        isShared: data.isShared || false,
        tags: data.tags || [],
      };
    });
  }

  async createPlayerList(listData) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const list = {
      name: listData.name || "Untitled List",
      description: listData.description || "",
      playerIds: listData.playerIds || [],
      tags: listData.tags || [],
      isShared: listData.isShared || false,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(this.playerListsRef, list);

    return {
      id: docRef.id,
      ...list,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async updatePlayerList(updateData) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    // Extract the ID from the updateData
    const { id: listId, ...data } = updateData;
    if (!listId) throw new Error("List ID is required");

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }
    if (listDoc.data().userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    // Remove fields that shouldn't be updated directly
    const { userId: _, createdAt, ...safeUpdateData } = data;

    const updatePayload = {
      ...safeUpdateData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(this.playerListsRef, listId), updatePayload);

    const updatedDoc = await getDoc(doc(this.playerListsRef, listId));
    return this.processPlayerListDocuments({ docs: [updatedDoc] })[0];
  }

  async getPlayerListById(listId) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const listDoc = await getDoc(doc(this.playerListsRef, listId));

    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }

    const listData = listDoc.data();

    // Check if the list is shared or owned by the user
    // If isShared is true, allow access regardless of userId
    if (listData.userId !== userId && listData.isShared !== true) {
      console.warn(
        "Access denied: User does not own list and list is not shared",
        {
          listId,
          listOwnerId: listData.userId,
          currentUserId: userId,
          isShared: listData.isShared,
        }
      );
      throw new Error("Unauthorized access to player list");
    }

    return {
      id: listDoc.id,
      ...listData,
      createdAt: listData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: listData.updatedAt?.toDate?.()?.toISOString() || null,
      playerIds: listData.playerIds || [],
      tags: listData.tags || [],
      isShared: listData.isShared || false,
    };
  }

  async addPlayerToList(listId, playerId) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }

    const listData = listDoc.data();
    if (listData.userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    // Use a Set to avoid duplicates
    const playerIds = new Set(listData.playerIds || []);
    playerIds.add(playerId.toString());

    await updateDoc(doc(this.playerListsRef, listId), {
      playerIds: Array.from(playerIds),
      updatedAt: serverTimestamp(),
    });

    return Array.from(playerIds);
  }

  async addMultiplePlayersToList(listId, playerIds) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      throw new Error("No player IDs provided");
    }

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }

    const listData = listDoc.data();
    if (listData.userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    // Convert all IDs to strings and create a Set to avoid duplicates
    const existingPlayerIds = new Set(listData.playerIds || []);
    const newPlayerIds = playerIds.map((id) => id.toString());

    // Merge existing and new IDs
    newPlayerIds.forEach((id) => existingPlayerIds.add(id));

    // Update the list with all IDs
    await updateDoc(doc(this.playerListsRef, listId), {
      playerIds: Array.from(existingPlayerIds),
      updatedAt: serverTimestamp(),
    });

    return Array.from(existingPlayerIds);
  }

  async removePlayerFromList(listId, playerId) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }

    const listData = listDoc.data();
    if (listData.userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    const updatedPlayerIds = (listData.playerIds || []).filter(
      (id) => id !== playerId.toString()
    );

    await updateDoc(doc(this.playerListsRef, listId), {
      playerIds: updatedPlayerIds,
      updatedAt: serverTimestamp(),
    });

    return updatedPlayerIds;
  }

  async removeMultiplePlayersFromList(listId, playerIds) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      throw new Error("No player IDs provided");
    }

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }

    const listData = listDoc.data();
    if (listData.userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    // Convert all IDs to strings for consistent comparison
    const removeIds = new Set(playerIds.map((id) => id.toString()));

    const updatedPlayerIds = (listData.playerIds || []).filter(
      (id) => !removeIds.has(id)
    );

    await updateDoc(doc(this.playerListsRef, listId), {
      playerIds: updatedPlayerIds,
      updatedAt: serverTimestamp(),
    });

    return updatedPlayerIds;
  }

  async deletePlayerList(listId) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }
    if (listDoc.data().userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    await deleteDoc(doc(this.playerListsRef, listId));
  }

  async toggleListSharing(listId, isShared) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }
    if (listDoc.data().userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    await updateDoc(doc(this.playerListsRef, listId), {
      isShared: Boolean(isShared),
      updatedAt: serverTimestamp(),
    });

    return { listId, isShared: Boolean(isShared) };
  }

  async addTagToList(listId, tag) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    if (!tag || typeof tag !== "string") {
      throw new Error("Invalid tag");
    }

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }
    if (listDoc.data().userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    // Use arrayUnion to add tag only if it doesn't exist
    await updateDoc(doc(this.playerListsRef, listId), {
      tags: arrayUnion(tag),
      updatedAt: serverTimestamp(),
    });

    const updatedDoc = await getDoc(doc(this.playerListsRef, listId));
    return this.processPlayerListDocuments({ docs: [updatedDoc] })[0];
  }

  async removeTagFromList(listId, tag) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }
    if (listDoc.data().userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    const listData = listDoc.data();
    const updatedTags = (listData.tags || []).filter((t) => t !== tag);

    await updateDoc(doc(this.playerListsRef, listId), {
      tags: updatedTags,
      updatedAt: serverTimestamp(),
    });

    const updatedDoc = await getDoc(doc(this.playerListsRef, listId));
    return this.processPlayerListDocuments({ docs: [updatedDoc] })[0];
  }

  async duplicateList(listId, newName) {
    await this.waitForAuth();
    const userId = this.currentUser?.uid;
    if (!userId) throw new Error("User must be authenticated");

    const listDoc = await getDoc(doc(this.playerListsRef, listId));
    if (!listDoc.exists()) {
      throw new Error("Player list not found");
    }

    const listData = listDoc.data();
    // Allow duplicating shared lists
    const canAccess = listData.userId === userId || listData.isShared;
    if (!canAccess) {
      throw new Error("Unauthorized access to player list");
    }

    // Create a new list with the same data
    const newList = {
      name: newName || `${listData.name} (Copy)`,
      description: listData.description || "",
      playerIds: listData.playerIds || [],
      tags: listData.tags || [],
      isShared: false, // New list is not shared by default
      userId, // Owned by current user
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const newDocRef = await addDoc(this.playerListsRef, newList);

    return {
      id: newDocRef.id,
      ...newList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Clean up listeners when no longer needed
  cleanup() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  }
}

const manager = new PlayerListManager();
export default manager;
