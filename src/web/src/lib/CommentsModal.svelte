<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import X from './icons/X.svelte';
	import User from './icons/User.svelte';
	import Trash from './icons/Trash.svelte';
	import type { Ticket, TicketComment } from './stores';
	import { userStore } from './stores';

	export let ticket: Ticket;
	export let isOpen = false;
	export let defaultAuthor = ''; // Default user ID to use for new comments

	const dispatch = createEventDispatcher();

	let comments: TicketComment[] = [];
	let newComment = '';
	let selectedAuthor = '';
	let isLoading = false;
	let isSubmitting = false;

	// Helper function to get user display name
	$: getUserDisplayName = (userId: string | undefined) => {
		if (!userId) return 'Unknown User';
		const user = $userStore.find(u => u.id === userId);
		return user?.displayName || userId;
	};

	async function loadComments() {
		if (!isOpen || !ticket.id) return;
		
		isLoading = true;
		try {
			const response = await fetch(`/api/tickets/${ticket.id}/comments`);
			if (response.ok) {
				const fetchedComments = await response.json();
				// Sort comments chronologically (oldest first)
				comments = fetchedComments.sort((a: TicketComment, b: TicketComment) => 
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			}
		} catch (error) {
			console.error('Failed to load comments:', error);
		} finally {
			isLoading = false;
		}
	}

	async function addComment() {
		if (!newComment.trim() || isSubmitting || !selectedAuthor) return;

		isSubmitting = true;
		try {
			const response = await fetch(`/api/tickets/${ticket.id}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					content: newComment.trim(),
					author: selectedAuthor 
				})
			});

			if (response.ok) {
				const comment = await response.json();
				// Add new comment and resort to maintain chronological order
				comments = [...comments, comment].sort((a: TicketComment, b: TicketComment) => 
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
				newComment = '';
			}
		} catch (error) {
			console.error('Failed to add comment:', error);
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteComment(commentId: string) {
		if (!confirm('Are you sure you want to delete this comment?')) {
			return;
		}

		try {
			const response = await fetch(`/api/comments/${commentId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				comments = comments.filter(c => c.id !== commentId);
			}
		} catch (error) {
			console.error('Failed to delete comment:', error);
		}
	}

	function handleClose() {
		newComment = '';
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	// Load comments when modal opens
	$: if (isOpen) {
		loadComments();
		// Set default author: use defaultAuthor prop if provided, otherwise first user
		if (!selectedAuthor && $userStore.length > 0) {
			selectedAuthor = defaultAuthor || $userStore[0].id;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal backdrop -->
{#if isOpen}
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		on:click|self={handleClose}
	>
		<!-- Modal content -->
		<div 
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
					Comments - {ticket.title}
				</h2>
				<button 
					class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
					on:click={handleClose}
				>
					<X size={24} />
				</button>
			</div>

			<!-- Comments list -->
			<div class="flex-1 overflow-y-auto p-6">
				{#if isLoading}
					<div class="text-center py-8">
						<p class="text-gray-500 dark:text-gray-400">Loading comments...</p>
					</div>
				{:else if comments.length === 0}
					<div class="text-center py-8">
						<div class="text-gray-400 mb-4">
							<User size={48} class="mx-auto" />
						</div>
						<p class="text-gray-500 dark:text-gray-400">No comments yet</p>
						<p class="text-sm text-gray-400 dark:text-gray-500">Be the first to add a comment!</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each comments as comment (comment.id)}
							<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-3">
										<div class="p-1 bg-gray-200 dark:bg-gray-600 rounded-full">
											<User size={16} class="text-gray-600 dark:text-gray-300" />
										</div>
										<div>
											<p class="font-medium text-gray-900 dark:text-gray-100">
												{getUserDisplayName(comment.author)}
											</p>
											<p class="text-xs text-gray-500 dark:text-gray-400">
												{new Date(comment.createdAt).toLocaleString()}
											</p>
										</div>
									</div>
									<button 
										class="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
										title="Delete comment"
										on:click={() => deleteComment(comment.id)}
									>
										<Trash size={14} />
									</button>
								</div>
								<p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
									{comment.content}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Add comment form -->
			<div class="border-t border-gray-200 dark:border-gray-600 p-6">
				<form on:submit|preventDefault={addComment}>				<!-- Author Selection -->
				<div class="mb-4">
					<label for="comment-author" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Posting as
					</label>
					<select
						id="comment-author"
						bind:value={selectedAuthor}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
								focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
								bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
						disabled={isSubmitting}
					>
						<option value="">Select user...</option>
						{#each $userStore as user}
							<option value={user.id}>{user.displayName} (@{user.username})</option>
						{/each}
					</select>
				</div>
					<div class="mb-4">
						<label for="new-comment" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Add a comment
						</label>
						<textarea
							id="new-comment"
							bind:value={newComment}
							placeholder="Write your comment here..."
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
									focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
									bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
									placeholder-gray-500 dark:placeholder-gray-400"
							disabled={isSubmitting}
						></textarea>
					</div>
					<div class="flex justify-end gap-3">
						<button
							type="button"
							class="btn btn-secondary"
							on:click={handleClose}
						>
							Close
						</button>
						<button
							type="submit"
							class="btn btn-primary"
							disabled={!newComment.trim() || isSubmitting || !selectedAuthor}
						>
							{isSubmitting ? 'Adding...' : 'Add Comment'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}