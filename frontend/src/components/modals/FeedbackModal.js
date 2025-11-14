import React, { useMemo, useState } from "react";
import { Check } from "lucide-react";
import Modal from "./Modal";
import FeedbackManager from "../../managers/FeedbackManager";
import AuthManager from "../../managers/AuthManager";

const FeedbackModal = ({ isOpen, onClose }) => {
	const currentUserEmail = useMemo(() => AuthManager.getCurrentUser()?.email || "", []);
	const [message, setMessage] = useState("");
	const [category, setCategory] = useState("general");
	const [email, setEmail] = useState(currentUserEmail);
	const [isPublic, setIsPublic] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const resetState = () => {
		setMessage("");
		setCategory("general");
		setEmail(currentUserEmail);
		setIsPublic(false);
		setError("");
		setSuccess(false);
		setSubmitting(false);
	};

	const handleClose = () => {
		resetState();
		onClose?.();
	};

	const handleSubmit = async (e) => {
		e?.preventDefault?.();
		if (!message.trim()) {
			setError("Please enter your feedback.");
			return;
		}
		setSubmitting(true);
		setError("");
		try {
			await FeedbackManager.submitFeedback({ 
				message: message.trim(), 
				category, 
				email: email.trim(),
				isPublic
			});
			setSuccess(true);
			setTimeout(() => {
				handleClose();
			}, 1500);
		} catch (err) {
			setError(err?.message || "Failed to send feedback.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Send Feedback">
			<form onSubmit={handleSubmit} className="space-y-3">
				<div>
					<label className="block text-sm font-semibold text-gray-900 mb-1.5">Category</label>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
					>
						<option value="general">General Feedback</option>
						<option value="bug">Bug Report</option>
						<option value="feature">Feature Request</option>
						<option value="question">Question</option>
						<option value="other">Other</option>
					</select>
				</div>

				<div>
					<label className="block text-sm font-semibold text-gray-900 mb-1.5">Your Email (optional)</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
					/>
				</div>

				<div>
					<label className="block text-sm font-semibold text-gray-900 mb-1.5">Your Feedback</label>
					<textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						rows={3}
						placeholder="What can we improve or fix?"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 resize-none text-sm"
					/>
				</div>

				<div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
					<label className="flex items-center cursor-pointer group">
						<input
							type="checkbox"
							checked={isPublic}
							onChange={(e) => setIsPublic(e.target.checked)}
							className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
						/>
						<span className="ml-2.5 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
							<span className="font-medium">Make this feedback public</span>
							<span className="block text-xs text-gray-500 mt-0.5">Can we use this feedback as a testimonial for the product?</span>
						</span>
					</label>
				</div>

				{error ? (
					<div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
						{error}
					</div>
				) : null}
				{success ? (
					<div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
						<Check className="w-4 h-4" />
						Thanks for the feedback! We really appreciate it.
					</div>
				) : null}

				<div className="flex justify-end gap-2 pt-1">
					<button
						type="button"
						onClick={handleClose}
						className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
					>
						Close
					</button>
					<button
						type="submit"
						disabled={submitting}
						className="px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm"
					>
						{submitting ? "Sending..." : "Send Feedback"}
					</button>
				</div>
			</form>
		</Modal>
	);
};

export default FeedbackModal;

