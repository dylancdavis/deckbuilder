(ns deckbuilder.db
  (:require [deckbuilder.constants :as constants]
            [deckbuilder.game.cards :as cards]))

(def new-db
  {:game
   {:collection {:cards {cards/score 9 cards/basic-rules 1}
                 :decklists {:starting-deck constants/starting-deck-list}}
    :run nil}
   :ui
   {:current-view [:collection]
    :collection {:selected-deck nil}}})