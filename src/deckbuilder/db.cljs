(ns deckbuilder.db
  (:require [deckbuilder.constants :as constants])
  (:require [deckbuilder.game.cards :as cards]))

(def default-db
  {:view :collection
   :collection {:cards {cards/score 12 cards/basic-rules 7} :card-backs {} :decklists {:starting-deck constants/starting-deck-list}}
   :view-data {:selected-deck nil}})