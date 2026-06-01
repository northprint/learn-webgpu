<!--
  ヒーロー背景: ドットグリッド + アクセントグロー（CSSのみ・軽量）
  - 深い背景に溶けるドットグリッドで「GPU / 計算空間」的な質感
  - 上部中央に淡いシアンのグロー（オーブ）でWebGPUらしいエレクトリックな個性
  - prefers-reduced-motion を尊重（アニメOFF時は静止）
-->
<div class="hero-bg" aria-hidden="true">
	<div class="grid-layer"></div>
	<div class="glow glow-primary"></div>
	<div class="glow glow-secondary"></div>
</div>

<style>
	.hero-bg {
		position: absolute;
		inset: 0;
		z-index: -10;
		overflow: hidden;
		pointer-events: none;
	}

	/* ドットグリッド: 中心に向かって濃く、縁でフェード */
	.grid-layer {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(
			circle at center,
			color-mix(in srgb, var(--color-muted) 22%, transparent) 1px,
			transparent 1px
		);
		background-size: 28px 28px;
		-webkit-mask-image: radial-gradient(ellipse 75% 55% at 50% 32%, #000 0%, transparent 78%);
		mask-image: radial-gradient(ellipse 75% 55% at 50% 32%, #000 0%, transparent 78%);
		opacity: 0.7;
	}

	.glow {
		position: absolute;
		border-radius: 9999px;
		filter: blur(80px);
		opacity: 0.55;
		will-change: transform;
	}

	/* メイングロー: 上部中央、アクセントのシアンブルー */
	.glow-primary {
		top: -12%;
		left: 50%;
		width: 46rem;
		height: 30rem;
		transform: translateX(-50%);
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--color-accent) 55%, transparent) 0%,
			transparent 70%
		);
		animation: drift-primary 18s ease-in-out infinite alternate;
	}

	/* サブグロー: わずかに紫を差し色に（グラデの差し色のみ） */
	.glow-secondary {
		top: 4%;
		left: 30%;
		width: 28rem;
		height: 22rem;
		background: radial-gradient(
			circle,
			color-mix(in srgb, #7c3aed 38%, transparent) 0%,
			transparent 70%
		);
		opacity: 0.32;
		animation: drift-secondary 22s ease-in-out infinite alternate;
	}

	:global(:root.dark) .glow-primary {
		opacity: 0.4;
	}

	:global(:root.dark) .glow-secondary {
		opacity: 0.28;
	}

	@keyframes drift-primary {
		from {
			transform: translateX(-50%) translateY(0) scale(1);
		}
		to {
			transform: translateX(-46%) translateY(14px) scale(1.06);
		}
	}

	@keyframes drift-secondary {
		from {
			transform: translate(0, 0) scale(1);
		}
		to {
			transform: translate(24px, -12px) scale(1.1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.glow {
			animation: none !important;
		}
	}
</style>
