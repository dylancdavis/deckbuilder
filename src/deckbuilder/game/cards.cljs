(ns deckbuilder.game.cards)

(def example {:name "Example Card"
              :description "This card is an example."
              :event [:add-energy]})

(def two {:name "Card #2"
          :description "Second card in the deck"
          :event [:add-energy]})

(def energy {:name "Energize"
             :description "+1 Energy"
             :event [:add-energy]})

(def starting-round {:draw-pile [energy energy two two example example] :hand nil
                     :discard-pile []})