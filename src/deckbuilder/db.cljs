(ns deckbuilder.db
  (:require [deckbuilder.constants :as constants]
            [deckbuilder.game.cards :as cards]))

(def default-db
  {:view :collection
   :collection {:cards [[cards/energy 2] [cards/credit-generator 3]] :card-backs {} :decklists [constants/starting-deck-list]}
   :view-data {:selected-deck nil}})