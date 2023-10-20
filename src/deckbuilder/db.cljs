(ns deckbuilder.db
  (:require [deckbuilder.constants :as constants]
            [deckbuilder.game.cards :as cards]))

(def default-db
  {:view :collection
   :collection {:cards '([cards/energy 2] [cards/credit-generator 1]) :card-backs {} :decklists [constants/starting-deck-list]}})