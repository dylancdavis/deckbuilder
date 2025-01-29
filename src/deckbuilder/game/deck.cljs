(ns deckbuilder.game.deck
  (:require [deckbuilder.utilities.counter :refer [total]]))

(defn deck-in-size-range? "Returns true if a `deck` has a size within the range specified by its rules card." [deck]
  (let [deck-size (total (:cards deck))
        rules-card (:rules-card deck)
        [min-size max-size] (get-in rules-card [:deck-limits :size])]
    (if (nil? rules-card) true (<= min-size deck-size max-size))))

(def deck-checks {:in-size-range deck-in-size-range?})

(defn check-deck-validity "Given a `deck`, a `collection` and a `checks` list of keyword-predicate pairs, returns a map for whether each check was passed."
  [deck collection]
  (reduce (fn [acc [check-key check-fn]]
            (assoc acc check-key (check-fn deck collection)))
          {}
          deck-checks))