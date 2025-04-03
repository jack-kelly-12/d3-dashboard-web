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
} from "firebase/firestore";
import AuthManager from "./AuthManager";

class PlayerListManager {
  constructor() {
    this.playerListsRef = collection(db, "playerLists");
    this.authInitialized = false;
    this.currentUser = null;

    AuthManager.onAuthStateChanged((user) => {
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
        // Fallback if the composite index doesn't exist
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

  async updatePlayerList(listId, updateData) {
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

    const { id, userId: _, createdAt, ...safeUpdateData } = updateData;

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

    if (listData.userId !== userId) {
      throw new Error("Unauthorized access to player list");
    }

    return {
      id: listDoc.id,
      ...listData,
      createdAt: listData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: listData.updatedAt?.toDate?.()?.toISOString() || null,
      playerIds: listData.playerIds || [],
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
}

const manager = new PlayerListManager();
export default manager;
