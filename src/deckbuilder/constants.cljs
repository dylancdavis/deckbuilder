(ns deckbuilder.constants
  (:require [deckbuilder.game.cards :as cards]))

(def starting-deck-list (concat (take 7 (repeat cards/energy)) (take 3 (repeat cards/credit-generator))))

(def starting-round-resources {:energy 0 :credits 0})

(def displays {:resources {:energy "Energy" :credits "Credits"}})