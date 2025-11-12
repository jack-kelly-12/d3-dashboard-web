import { db } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import AuthManager from "./AuthManager";

class FeedbackManager {
	constructor() {
		this.feedbackRef = collection(db, "feedback");
	}

	async submitFeedback({ message, category, email }) {
		const user = AuthManager.getCurrentUser();
		const payload = {
			message: message || "",
			category: category || "general",
			email: email || user?.email || null,
			userId: user?.uid || null,
			isAnonymousUser: Boolean(user?.isAnonymous),
			createdAt: serverTimestamp(),
		};

		const docRef = await addDoc(this.feedbackRef, payload);
		return { id: docRef.id };
	}
}

const manager = new FeedbackManager();
export default manager;

