(ns deckbuilder.db
  (:require [deckbuilder.game.cards :as cards]))

(def default-db
  {:round cards/starting-round
   :resources {:energy {:display "Energy" :value 0} :credits {:display "Credits" :value 0}}})
