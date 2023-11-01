(ns deckbuilder.game.cards)

(def credit-generator {:name "Credit Generator"
                       :description "Convert 3 Energy to 1 Credit"
                       :event [:gain-resource :credit 1]})

(def energy {:name "Energize"
             :description "+1 Energy"
             :event [:gain-resource :energy 1]})

(def starting-deck-list (concat (take 7 (repeat energy)) (take 3 (repeat credit-generator))))

(defn with-keys [coll]
  (map-indexed (fn [idx item] (assoc item :key idx)) coll))

(def starting-round {:draw-pile (with-keys starting-deck-list) :hand nil
                     :discard-pile []})
