(ns deckbuilder.constants
  (:require [deckbuilder.game.cards :as cards]))

;; (def starting-deck-list {:name "Starter Deck" :cardlist (concat (take 7 (repeat cards/energy)) (take 3 (repeat cards/credit-generator)))})

(def starting-deck-list {:name "Starter Deck" :cards {cards/energy 7 cards/credit-generator 3}})

(def starting-round-resources {:energy 0 :credits 0})

(def displays {:resources {:energy "Energy" :credits "Credits"}})