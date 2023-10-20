(ns deckbuilder.constants
  (:require [deckbuilder.game.cards :as cards]))

(def starting-deck-list (concat (take 7 (repeat cards/energy)) (take 3 (repeat cards/credit-generator))))