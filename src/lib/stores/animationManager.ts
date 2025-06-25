/**
 * Animation manager for controlling requestAnimationFrame loops
 */
class AnimationManager {
	private activeAnimations = new Set<number>();
	private isDestroying = false;

	/**
	 * Register and start a new animation loop
	 */
	register(callback: FrameRequestCallback): number {
		// Stop all existing animations first
		this.stopAll();
		
		let currentId: number;
		
		// Create a wrapped callback that manages the animation ID
		const wrappedCallback = (time: number) => {
			if (this.isDestroying || !this.activeAnimations.has(currentId)) {
				return;
			}
			
			// Call the original callback
			callback(time);
			
			// Continue the loop only if not destroying
			if (!this.isDestroying) {
				// Remove old ID and add new one
				this.activeAnimations.delete(currentId);
				currentId = requestAnimationFrame(wrappedCallback);
				this.activeAnimations.add(currentId);
			}
		};
		
		// Start the animation
		currentId = requestAnimationFrame(wrappedCallback);
		this.activeAnimations.add(currentId);
		
		console.log('[AnimationManager] Started animation:', currentId);
		return currentId;
	}

	/**
	 * Stop a specific animation
	 */
	stop(id: number) {
		if (this.activeAnimations.has(id)) {
			cancelAnimationFrame(id);
			this.activeAnimations.delete(id);
			console.log('[AnimationManager] Stopped animation:', id);
		}
	}

	/**
	 * Stop all active animations
	 */
	stopAll() {
		this.isDestroying = true;
		const count = this.activeAnimations.size;
		
		this.activeAnimations.forEach(id => {
			cancelAnimationFrame(id);
		});
		
		this.activeAnimations.clear();
		this.isDestroying = false;
		
		if (count > 0) {
			console.log('[AnimationManager] Stopped all animations:', count);
		}
	}

	/**
	 * Get the number of active animations
	 */
	getActiveCount(): number {
		return this.activeAnimations.size;
	}
}

// Export a singleton instance
export const animationManager = new AnimationManager();