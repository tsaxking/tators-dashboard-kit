import { writable, type Subscriber, type Unsubscriber, type Writable } from 'svelte/store';
import { attempt } from 'ts-utils/check';

export namespace Dashboard {
	type CardData = {
		show: boolean;
		maximized: boolean;
	};

	export const hiddenCards = writable(new Set<Card>());

	export class Card implements Writable<CardData> {
		public static readonly cards = new Map<string, Card>();

		public state: CardData = {
			show: true,
			maximized: false
		};

		private readonly subscribers = new Set<(value: CardData) => void>();

		constructor(
			public readonly config: {
				name: string;
				icon: string;
				iconType: 'bi' | 'fa' | 'material-icons';
				id: string;
			}
		) {
			Card.cards.set(config.id, this);

			const res = pull();
			if (res.isOk()) {
				if (res.value.has(config.name)) {
					this.state.show = false;
				}
			}
		}

		set(value: CardData) {
			this.state = value;
			this.subscribers.forEach((subscriber) => subscriber(this.state));
			if (this.state.show) {
				hiddenCards.update((cards) => {
					cards.delete(this);
					return cards;
				});
			} else {
				hiddenCards.update((cards) => {
					cards.add(this);
					return cards;
				});
			}

			save();
		}

		update(fn: (value: CardData) => CardData) {
			this.set(fn(this.state));
		}

		private _onAllUnsubscribe?: () => void;

		subscribe(run: Subscriber<CardData>, invalidate?: () => void): Unsubscriber {
			this.subscribers.add(run);
			run(this.state);

			return () => {
				this.subscribers.delete(run);
				invalidate?.();
				if (this.subscribers.size === 0) this._onAllUnsubscribe?.();
			};
		}

		public onAllUnsubscribe(fn: () => void) {
			this._onAllUnsubscribe = fn;
		}

		show() {
			this.update((state) => ({ ...state, show: true }));
		}

		hide() {
			this.update((state) => ({ ...state, show: false }));
		}

		minimize() {
			this.update((state) => ({ ...state, maximized: true }));
		}

		maximize() {
			this.update((state) => ({ ...state, maximized: false }));
		}
	}

	const save = () => {
		return attempt(() => {
			const hidden = JSON.stringify(
				[...Card.cards.values()].filter((card) => !card.state.show).map((card) => card.config.name)
			);
			localStorage.setItem(`dashboard-cards-${location.pathname}`, hidden);
		});
	};

	const pull = () => {
		return attempt(() => {
			const hidden = localStorage.getItem(`dashboard-cards-${location.pathname}`);
			if (!hidden) return new Set<string>();
			return new Set(JSON.parse(hidden));
		});
	};
}
