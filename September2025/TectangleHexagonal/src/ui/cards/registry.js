// Simple registry for GSOS cards (apps)
// WEBWAY:ww-2025-091: Centralize card list for validation and UX

const _state = {
  cards: []
};

export function registerCards(cards) {
  try {
    _state.cards = Array.isArray(cards)
      ? cards.map(c => ({ id: c.id, title: c.title }))
      : [];
  } catch {
    _state.cards = [];
  }
}

export function getCards() {
  return _state.cards.slice();
}

export function clearCards() {
  _state.cards = [];
}
