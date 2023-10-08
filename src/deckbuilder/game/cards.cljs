(ns deckbuilder.game.cards)

(def example {:name "Example Card"
              :description "This card is an example."
              :effect #(println "Example card played")})

(def two {:name "Card #2"
          :description "Second card in the deck"
          :effect #(println "Card #2 played")})

(def energy {:name "Energize"
             :description "+1 Energy"
             :effect #(println "Energize played")})

(def starting-deck {:draw-pile [energy energy two two example example] :hand nil
                    :discard-pile []})