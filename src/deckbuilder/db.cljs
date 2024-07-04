(ns deckbuilder.db
  (:require [deckbuilder.constants :as constants])
  (:require [deckbuilder.game.cards :as cards]))

(def default-db
  {:view :collection
   :collection {:cards {cards/score 12 cards/basic-rules 7} :card-backs {} :decklists {:starting-deck constants/starting-deck-list}}
   :view-data {:selected-deck nil}})

(def new-db
  {:game
   {:collection {:cards {cards/score 12 cards/basic-rules 7} :card-backs {} :decklists {:starting-deck constants/starting-deck-list}}
    :run nil}
   :ui
   {:current-view [:collection]
    :collection {:selected-deck nil}}})

(def run-data {:resources {:points 0}
               :cards {:draw-pile [] :hand [] :discard-pile []}
               :deck-info {:cards [] :rules-card nil}
               :outcomes []})