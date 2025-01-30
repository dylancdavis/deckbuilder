(ns deckbuilder.game.deck
  (:require [deckbuilder.utilities.counter :refer [total missing-counts]]))

(defn has-rules-card? "Returns true if a `deck` has a rules card." [deck] (not (nil? (:rules-card deck))))

(defn deck-in-size-range? "Returns true if a `deck` has a size within the range specified by its rules card." [deck]
  (let [deck-size (total (:cards deck))
        rules-card (:rules-card deck)
        [min-size max-size] (get-in rules-card [:deck-limits :size])]
    (if (nil? rules-card) true (<= min-size deck-size max-size))))

(def deck-checks {:has-rules-card has-rules-card?
                  :in-size-range deck-in-size-range?})

(defn cards-not-in-collection "Returns a counter of cards in `deck` that are not in `collection`, with values equal to the number of cards missing."
  [deck collection] (missing-counts (:cards deck) collection))

(defn check-deck-validity "Given a `deck`, a `collection` and a `checks` list of keyword-predicate pairs, returns a map for whether each check was passed."
  [deck collection]
  (reduce (fn [acc [check-key check-fn]]
            (assoc acc check-key (check-fn deck)))
          {:has-cards-in-collection (empty? (cards-not-in-collection deck collection))}
          deck-checks))