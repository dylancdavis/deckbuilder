(ns deckbuilder.game.deck
  (:require [deckbuilder.utilities.counter :refer [total]]))

(defn check-deck-validity [deck collection]
  (let [deck-size (total (:cards deck))
        [min-size max-size] (get-in deck [:rules-card :deck-limits :size])]
    (<= min-size deck-size max-size)))