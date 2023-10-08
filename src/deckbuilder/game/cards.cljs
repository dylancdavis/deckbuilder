(ns deckbuilder.game.cards)

(def example {:name "Example Card"
              :description "This card is an example."
              :effect #(js/console.log "Example card played")})

(def two {:name "Card #2"
          :description "Second card in the deck"
          :effect #(js/console.log "Card #2 played")})

(def energy {:name "Energize"
             :description "+1 Energy"
             :effect #(js/console.log "Energize played")})

(def starting-round {:draw-pile [energy energy two two example example] :hand nil
                     :discard-pile []})