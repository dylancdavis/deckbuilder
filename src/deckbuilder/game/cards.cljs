(ns deckbuilder.game.cards)

(def credit-generator {:name "Credit Generator"
                       :description "Convert 3 Energy to 1 Credit"
                       :event [:generate-credit]})

(def energy {:name "Energize"
             :description "+1 Energy"
             :event [:add-energy]})

(def starting-round {:draw-pile (concat (take 7 (repeat energy)) (take 2 (repeat credit-generator))) :hand nil
                     :discard-pile []})
